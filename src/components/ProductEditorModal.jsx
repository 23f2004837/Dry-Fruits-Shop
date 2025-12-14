import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import './ProductEditorModal.css';

const QUANTITY_OPTIONS = ['250', '500', '1000'];
const QUALITY_OPTIONS = ['Premium', 'Best', 'Normal'];

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  quality: QUALITY_OPTIONS[0],
  quantity: QUANTITY_OPTIONS[0],
  imageUrl: '',
  imagePreview: '',
  imageFile: null
};

const ProductEditorModal = ({ open, mode = 'add', product, onClose, onSave }) => {
  const [formState, setFormState] = useState(emptyProduct);
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (open) {
      const resolvedQuantity =
        typeof product?.quantity === 'number' && !Number.isNaN(product.quantity)
          ? product.quantity.toString()
          : QUANTITY_OPTIONS[0];
      const normalizedQuantity = QUANTITY_OPTIONS.includes(resolvedQuantity)
        ? resolvedQuantity
        : QUANTITY_OPTIONS[0];
      const resolvedQuality = product?.quality ?? QUALITY_OPTIONS[0];
      const normalizedQuality = QUALITY_OPTIONS.includes(resolvedQuality)
        ? resolvedQuality
        : QUALITY_OPTIONS[0];

      setFormState({
        name: product?.name ?? '',
        description: product?.description ?? '',
        price: product?.price?.toString() ?? '',
        quality: normalizedQuality,
        quantity: normalizedQuantity,
        imageUrl: product?.imageUrl ?? product?.image ?? '',
        imagePreview: product?.imageUrl ?? product?.image ?? '',
        imageFile: null
      });
    } else {
      setFormState(emptyProduct);
    }
  }, [open, product]);

  useEffect(() => {
    if (!open) return undefined;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.name.trim()) return;

    const payload = {
      id: product?.id ?? null,
      imageRef: product?.imageRef ?? null,
      imageCollection: product?.imageCollection ?? undefined,
      name: formState.name.trim(),
      description: formState.description.trim(),
      price: Number(formState.price) || 0,
      quality: formState.quality.trim(),
      quantity: Number(formState.quantity) || 0,
      imageUrl:
        formState.imageUrl.trim() ||
        'https://via.placeholder.com/600x400.png?text=Dry+Fruit+Product',
      imageFile: formState.imageFile
    };

    onSave?.(payload);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormState((prev) => ({
        ...prev,
        imagePreview: reader.result,
        imageFile: {
          dataUrl: reader.result,
          fileName: file.name,
          size: file.size,
          contentType: file.type
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearImageSelection = () => {
    setFormState((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: prev.imageUrl
    }));
  };

  return createPortal(
    <div className="product-editor-overlay" onClick={onClose}>
      <div className="product-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="product-editor-header">
          <div>
            <p className="editor-label">{isEdit ? 'Edit Product' : 'Add Product'}</p>
            <h3>{isEdit ? `Editing ${product?.name}` : 'Create new product'}</h3>
          </div>
          <button type="button" className="editor-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="product-editor-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <div className="editor-grid">
            <label>
              <span>Price (₹)</span>
              <input
                type="number"
                name="price"
                value={formState.price}
                onChange={handleChange}
                min="0"
                step="1"
                required
              />
            </label>
            <label>
              <span>Quality</span>
              <div className="select-wrapper">
                <select name="quality" value={formState.quality} onChange={handleChange} required>
                  {QUALITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label>
              <span>Quantity Type (grams)</span>
              <div className="select-wrapper">
                <select
                  name="quantity"
                  value={formState.quantity}
                  onChange={handleChange}
                  required
                >
                  {QUANTITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{`${option} g`}</option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="editor-upload">
            <label className="upload-label">
              <span>Upload Image</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </label>
            <div
              className={`image-preview-card ${formState.imagePreview ? 'has-image' : 'is-empty'}`}
            >
              {formState.imagePreview ? (
                <>
                  <img src={formState.imagePreview} alt="Product preview" />
                  {formState.imageFile && (
                    <div className="image-preview-meta">
                      <span className="image-name">{formState.imageFile.fileName}</span>
                      <span className="image-size">{formatFileSize(formState.imageFile.size)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="image-preview-placeholder">
                  <p>No image selected</p>
                  <small>Upload a file to see a live preview.</small>
                </div>
              )}
              {formState.imageFile && (
                <button type="button" onClick={clearImageSelection} className="clear-image-btn">
                  Remove Upload
                </button>
              )}
            </div>
          </div>

          <div className="editor-actions">
            <button type="button" className="editor-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="editor-btn primary">
              {isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProductEditorModal;
