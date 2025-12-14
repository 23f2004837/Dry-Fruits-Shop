import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  addDoc,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db } from "../lib/firebase";

/* ---------------------------------------------
   Utility: Firestore readiness delay
---------------------------------------------- */

export const waitForFirestoreReady = async () => {
  // Firestore takes 100–250ms to attach auth token after popup login
  await new Promise((res) => setTimeout(res, 180));
};

/* ---------------------------------------------
   Safe getDoc with retry logic
---------------------------------------------- */

const safeGetDoc = async (ref) => {
  try {
    return await getDoc(ref);
  } catch (err) {
    // Firestore not ready yet
    if (err.message.includes("offline") || err.code === "unavailable") {
      await new Promise((res) => setTimeout(res, 150));
      return await getDoc(ref); // retry once
    }
    throw err;
  }
};

/* ---------------------------------------------
   Sanitizer
---------------------------------------------- */

const sanitizeCartItems = (items = []) =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image ?? null,
    unit: item.unit ?? null,
    quality: item.quality ?? null,
  }));

const CART_COLLECTION = "carts";
const ORDERS_COLLECTION = "orders";
const INVOICES_COLLECTION = "invoices";
const PRODUCTS_COLLECTION = "products";
const DEFAULT_IMAGE_COLLECTION = "images";
const LEGACY_IMAGE_COLLECTION = "productImages";
const IMAGE_COLLECTIONS = [DEFAULT_IMAGE_COLLECTION, LEGACY_IMAGE_COLLECTION];

export const ORDER_STATUS_OPTIONS = Object.freeze([
  "Placed",
  "Accepted",
  "InProgress",
  "Completed",
]);

export const PAYMENT_STATUS_OPTIONS = Object.freeze(["NotPaid", "Paid"]);

export const DELIVERY_STATUS_OPTIONS = Object.freeze([
  "NotAssigned",
  "Assigned",
  "OutForDelivery",
  "Delivered",
]);

const OPEN_ORDER_STATUSES = ORDER_STATUS_OPTIONS.filter((status) => status !== "Completed");

/* ---------------------------------------------
   CART FUNCTIONS
---------------------------------------------- */

export const fetchCartForUser = async (userId) => {
  if (!userId) return [];

  const ref = doc(db, CART_COLLECTION, userId);
  const snap = await safeGetDoc(ref);

  if (!snap.exists()) return [];
  const data = snap.data();

  return sanitizeCartItems(data.items ?? []);
};

export const upsertCartForUser = async (userId, items = []) => {
  if (!userId) return;

  const payload = {
    userId,
    items: sanitizeCartItems(items),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, CART_COLLECTION, userId), payload, { merge: true });
};

export const subscribeToCart = (userId, callback) => {
  if (!userId) return () => {};

  return onSnapshot(
    doc(db, CART_COLLECTION, userId),
    (snap) => {
      if (!snap.exists()) return callback([]);
      const data = snap.data();
      callback(sanitizeCartItems(data.items ?? []));
    },
    (err) => console.error("Cart subscription error:", err)
  );
};

/* ---------------------------------------------
   ORDER + INVOICE FUNCTIONS
---------------------------------------------- */

export const createOrderWithInvoice = async ({
  user,
  items,
  subtotal,
  tax,
  total,
  deliveryAddress,
  paymentMethod = "WhatsApp",
}) => {
  if (!user?.uid) throw new Error("User must be logged in.");

  const sanitized = sanitizeCartItems(items);
  const invoiceNumber = `INV-${Date.now()}`;

  const orderPayload = {
    userId: user.uid,
    userName: user.name ?? user.email ?? "Customer",
    userEmail: user.email ?? null,
    items: sanitized,
    subtotal,
    tax,
    total,
    deliveryAddress: deliveryAddress ?? "",
    paymentMethod,
    status: ORDER_STATUS_OPTIONS[0],
    statusUpdatedAt: serverTimestamp(),
    paymentStatus: PAYMENT_STATUS_OPTIONS[0],
    paymentStatusUpdatedAt: serverTimestamp(),
    deliveryStatus: DELIVERY_STATUS_OPTIONS[0],
    deliveryStatusUpdatedAt: serverTimestamp(),
    invoiceNumber,
    createdAt: serverTimestamp(),
  };

  // Create order
  const orderRef = await addDoc(collection(db, ORDERS_COLLECTION), orderPayload);

  // Invoice
  const invoicePayload = {
    orderId: orderRef.id,
    invoiceNumber,
    userId: user.uid,
    items: sanitized,
    subtotal,
    tax,
    total,
    issuedAt: serverTimestamp(),
    deliveryAddress: deliveryAddress ?? "",
    paymentMethod,
  };

  await setDoc(doc(db, INVOICES_COLLECTION, orderRef.id), invoicePayload);

  return {
    orderId: orderRef.id,
    invoiceNumber,
  };
};

export const fetchOrdersForUser = async (userId) => {
  if (!userId) return [];

  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const fetchOpenOrders = async () => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("status", "in", OPEN_ORDER_STATUSES),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const fetchInvoiceByOrderId = async (id) => {
  if (!id) return null;

  const snap = await safeGetDoc(doc(db, INVOICES_COLLECTION, id));
  return snap.exists() ? { id, ...snap.data() } : null;
};

export const fetchInvoicesForUser = async (userId) => {
  if (!userId) return [];

  const q = query(
    collection(db, INVOICES_COLLECTION),
    where("userId", "==", userId),
    orderBy("issuedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const updateOrderStatuses = async ({
  orderId,
  status,
  paymentStatus,
  deliveryStatus,
}) => {
  if (!orderId) throw new Error("Order ID is required");

  const payload = {
    updatedAt: serverTimestamp(),
  };

  if (status) {
    payload.status = status;
    payload.statusUpdatedAt = serverTimestamp();
  }

  if (paymentStatus) {
    payload.paymentStatus = paymentStatus;
    payload.paymentStatusUpdatedAt = serverTimestamp();
  }

  if (deliveryStatus) {
    payload.deliveryStatus = deliveryStatus;
    payload.deliveryStatusUpdatedAt = serverTimestamp();
  }

  await setDoc(doc(db, ORDERS_COLLECTION, orderId), payload, { merge: true });
};

/* ---------------------------------------------
   PRODUCT + IMAGE FUNCTIONS
---------------------------------------------- */

const toDocumentList = (snapshot) =>
  snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

const buildImageKey = (collectionName, imageId) => `${collectionName}:${imageId}`;

const fetchImageDocument = async (imageId, preferredCollection) => {
  const collectionsToTry = preferredCollection
    ? [preferredCollection, ...IMAGE_COLLECTIONS.filter((name) => name !== preferredCollection)]
    : IMAGE_COLLECTIONS;

  for (const collectionName of collectionsToTry) {
    if (!collectionName) continue;
    try {
      const snap = await safeGetDoc(doc(db, collectionName, imageId));
      if (snap.exists()) {
        return { data: snap.data(), collection: collectionName };
      }
    } catch (error) {
      console.error(`Failed to fetch image ${imageId} from ${collectionName}`, error);
    }
  }
  return null;
};

const fetchImageMap = async (imageRefs = []) => {
  if (!imageRefs.length) return {};

  const uniqueRefs = Array.from(
    imageRefs.reduce((acc, ref) => {
      const key = buildImageKey(ref.collection ?? DEFAULT_IMAGE_COLLECTION, ref.id);
      if (!acc.has(key)) acc.set(key, ref);
      return acc;
    }, new Map()).values()
  );

  const entries = await Promise.all(
    uniqueRefs.map(async ({ id, collection }) => {
      const result = await fetchImageDocument(id, collection);
      return result ? [buildImageKey(result.collection, id), result.data] : null;
    })
  );

  return entries.reduce((acc, entry) => {
    if (!entry) return acc;
    const [key, data] = entry;
    acc[key] = data;
    return acc;
  }, {});
};

const upsertImageDocument = async ({ imageUrl, label, imageRef, imageCollection, imageFile }) => {
  const collectionName = imageCollection || DEFAULT_IMAGE_COLLECTION;
  let payload = null;

  if (imageFile?.dataUrl) {
    payload = {
      url: imageFile.dataUrl,
      fileName: imageFile.fileName ?? null,
      contentType: imageFile.contentType ?? null,
      size: imageFile.size ?? null,
      storageType: "inline",
      label: label ?? null,
      updatedAt: serverTimestamp(),
    };
  } else if (imageUrl) {
    payload = {
      url: imageUrl,
      storageType: "remote",
      label: label ?? null,
      updatedAt: serverTimestamp(),
    };
  }

  if (imageRef) {
    if (payload) {
      await setDoc(doc(db, collectionName, imageRef), payload, { merge: true });
    }
    return { id: imageRef, collection: collectionName };
  }

  if (!payload) return null;

  const newImageDocRef = doc(collection(db, collectionName));
  await setDoc(newImageDocRef, {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return { id: newImageDocRef.id, collection: collectionName };
};

export const fetchProductsWithImages = async () => {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  if (snapshot.empty) return [];

  const products = toDocumentList(snapshot);
  const imageRefs = products
    .map((product) =>
      product.imageRef
        ? { id: product.imageRef, collection: product.imageCollection ?? DEFAULT_IMAGE_COLLECTION }
        : null
    )
    .filter(Boolean);
  const imageMap = await fetchImageMap(imageRefs);

  return products.map((product) => ({
    ...product,
    imageUrl:
      (product.imageRef
        ? imageMap[
            buildImageKey(product.imageCollection ?? DEFAULT_IMAGE_COLLECTION, product.imageRef)
          ]?.url
        : null) ?? product.imageUrl ?? "",
    image:
      (product.imageRef
        ? imageMap[
            buildImageKey(product.imageCollection ?? DEFAULT_IMAGE_COLLECTION, product.imageRef)
          ]?.url
        : null) ?? product.image ?? "",
  }));
};

export const upsertProductWithImage = async ({
  id,
  name,
  description,
  price,
  quality,
  quantity,
  imageUrl,
  imageRef,
  imageCollection,
  imageFile,
}) => {
  if (!name) throw new Error("Product name is required");

  const preparedPrice = typeof price === "number" ? price : Number(price) || 0;
  const preparedQuantity = typeof quantity === "number" ? quantity : Number(quantity) || 0;
  const imageResult = await upsertImageDocument({
    imageUrl,
    imageRef,
    imageCollection,
    imageFile,
    label: name,
  });

  const isUpdate = Boolean(id);
  const productRef = isUpdate
    ? doc(db, PRODUCTS_COLLECTION, id)
    : doc(collection(db, PRODUCTS_COLLECTION));

  const payload = {
    name,
    description: description ?? "",
    price: preparedPrice,
    quality: quality ?? "",
    quantity: preparedQuantity,
    imageRef: imageResult?.id ?? imageRef ?? null,
    imageCollection: imageResult?.collection ?? imageCollection ?? DEFAULT_IMAGE_COLLECTION,
    updatedAt: serverTimestamp(),
  };

  if (!isUpdate) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(productRef, payload, { merge: true });

  return {
    id: productRef.id,
    ...payload,
    imageUrl,
  };
};

export const importProductsToFirestore = async (items = []) => {
  if (!Array.isArray(items) || !items.length) return;

  for (const item of items) {
    try {
      await upsertProductWithImage({
        id: item.id?.toString?.() ?? undefined,
        name: item.name,
        description: item.description,
        price: item.price,
        quality: item.quality ?? "",
        quantity: item.quantity ?? 0,
        imageUrl: item.image,
        imageCollection: DEFAULT_IMAGE_COLLECTION,
      });
    } catch (error) {
      console.error("Failed to import product", item?.name, error);
    }
  }
};
