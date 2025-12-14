import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import ProductEditorModal from '../components/ProductEditorModal';
import {
  fetchProductsWithImages,
  importProductsToFirestore,
  upsertProductWithImage
} from '../utils/firestoreData';
import { isAdminUser } from '../utils/admin';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('add');
  const [editingProduct, setEditingProduct] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = isAdminUser(user);

  const loadProducts = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      let data = await fetchProductsWithImages();

      if (!data.length) {
        const response = await fetch('/products.json');
        if (response.ok) {
          const seedData = await response.json();
          await importProductsToFirestore(seedData);
          data = await fetchProductsWithImages();
        }
      }

      setProducts(data);
      setError('');
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddProduct = () => {
    if (!isAdmin) return;
    setEditorMode('add');
    setEditingProduct(null);
    setEditorOpen(true);
  };

  const handleEditSingleProduct = (product) => {
    if (!isAdmin) return;
    setEditorMode('edit');
    setEditingProduct(product);
    setEditorOpen(true);
  };

  const handleSaveProduct = async (payload) => {
    try {
      await upsertProductWithImage(payload);
      await loadProducts(true);
      setEditorOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  return (
  <div className="home-page">
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="hero-section">
            <h2>Premium Quality Dry Fruits</h2>
            <p>Fresh, nutritious, and delivered to your doorstep</p>  
          </div>
          
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={isAdmin ? handleEditSingleProduct : undefined}
                  />
                ))}

                {isAdmin && (
                  <button
                    type="button"
                    className="product-add-card"
                    onClick={handleAddProduct}
                  >
                    <span className="add-icon">+</span>
                    <span>Add Product</span>
                  </button>
                )}
              </div>

              {isAdmin && (
                <div className="admin-actions">
                  <button
                    type="button"
                    className="admin-button primary"
                    onClick={() => navigate('/order-backlog')}
                  >
                    Order Backlog
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <ProductEditorModal
        open={editorOpen}
        mode={editorMode}
        product={editingProduct}
        onClose={() => {
          setEditorOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

export default Home;
