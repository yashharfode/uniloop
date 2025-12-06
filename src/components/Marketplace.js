'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Loader2, X, Camera, MessageCircle, ShoppingBag, Heart, Edit3, Trash2, Flag, CheckCircle2, ChevronDown, SlidersHorizontal, Share2, MapPin, Star, ShoppingCart, Shield, Clock, User, CreditCard, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { doc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, query, onSnapshot, where, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import toast from 'react-hot-toast';

// ADMIN EMAILS
const ADMIN_EMAILS = [
    'yash.harfode.sati@gmail.com',
    'yashharfode123@gmail.com'
];

const isAdminUser = (email) => ADMIN_EMAILS.includes(email);

// Skeleton Loader Component
const SkeletonCard = () => (
    <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full animate-pulse">
        <div className="h-40 rounded-xl bg-gray-200 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="mt-auto pt-3 border-t border-gray-50">
            <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
    </div>
);

// Skeleton Grid
const SkeletonGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-24">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
);

// Enhanced Image Component with blur-up and fallback
const ProductImage = ({ src, alt, className = "" }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // If no src or empty string, show fallback directly
    if (!src || src.trim() === '') {
        return (
            <div className={`relative ${className}`}>
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
            )}
            {imageError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt || 'Product image'}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                        setImageError(true);
                        setImageLoaded(false);
                    }}
                />
            )}
        </div>
    );
};

// Verified Badge Component
const VerifiedBadge = ({ email }) => {
    const isVerified = email && (email.endsWith('@jec.ac.in') || email.endsWith('@college.edu'));
    if (!isVerified) return null;
    return (
        <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            Verified
        </div>
    );
};

// Product Card Component
const ProductCard = ({ item, user, onWishlistToggle, isWishlisted, onReport, isOwner, onClick, onDelete, isAdmin }) => {
    const [imageError, setImageError] = useState(false);
    const isOutOfStock = item.quantity === 0;

    return (
        <div
            onClick={onClick}
            className={`bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full group hover:shadow-md transition-all cursor-pointer ${isOutOfStock ? 'opacity-75' : ''}`}
        >
            <div className="h-40 rounded-xl overflow-hidden bg-gray-100 mb-3 relative">
                <ProductImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full group-hover:scale-105 transition duration-500"
                />
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md text-white ${item.type === 'Sell' ? 'bg-blue-500/80' : item.type === 'Rent' ? 'bg-purple-500/80' : 'bg-green-500/80'}`}>
                    {item.type}
                </span>
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">Out of Stock</span>
                    </div>
                )}
                {!isOwner && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onWishlistToggle(item.id);
                        }}
                        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition ${isWishlisted ? 'bg-red-500/90 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                )}
            </div>

            <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-auto">{item.title}</h4>

            <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-600 font-bold text-lg">₹{item.price}</span>
                    {item.quantity > 0 && (
                        <span className="text-xs text-gray-500 font-medium">{item.quantity} left</span>
                    )}
                </div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-5 h-5 bg-gray-200 rounded-full overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.sellerName}`} alt="u" />
                        </div>
                        <div className="flex flex-col">
                            <span className="truncate max-w-[60px]">{item.sellerName?.split(' ')[0]}</span>
                            {item.sellerEmail && <VerifiedBadge email={item.sellerEmail} />}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {!isOwner && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toast.success(`Contact: ${item.sellerName}`);
                                    }}
                                    className="text-blue-600 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100 transition"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReport(item);
                                    }}
                                    className="text-gray-500 bg-gray-50 p-1.5 rounded-lg hover:bg-gray-100 transition"
                                >
                                    <Flag className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        {(isOwner || isAdmin) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item.id);
                                }}
                                className="text-red-600 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Marketplace({ user, userData }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isMyListingsOpen, setIsMyListingsOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);
    const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemDetail, setSelectedItemDetail] = useState(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
    const [wishlist, setWishlist] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const isAdmin = isAdminUser(user?.email) || isAdminUser(userData?.email);

    // Fetch Items from Firestore Realtime
    useEffect(() => {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'market_items'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(fetchedItems);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching items:", error);
            toast.error("Failed to load items");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Wishlist
    useEffect(() => {
        if (!user) return;
        const wishlistRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wishlist', 'items');
        const unsubscribe = onSnapshot(wishlistRef, (docSnap) => {
            if (docSnap.exists()) {
                setWishlist(docSnap.data().itemIds || []);
            }
        });
        return () => unsubscribe();
    }, [user]);

    // Filter and Sort Logic
    const filteredAndSortedItems = items
        .filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = filter === "All" || item.category === filter;
            const matchesPrice = item.price >= priceRange.min && item.price <= priceRange.max;
            return matchesSearch && matchesFilter && matchesPrice;
        })
        .sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

    // My Listings
    const myListings = items.filter(item => item.sellerId === user?.uid);

    // Wishlist Toggle
    const handleWishlistToggle = async (itemId) => {
        if (!user) {
            toast.error("Please login to save items");
            return;
        }
        try {
            const wishlistRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wishlist', 'items');
            const isWishlisted = wishlist.includes(itemId);
            const newWishlist = isWishlisted
                ? wishlist.filter(id => id !== itemId)
                : [...wishlist, itemId];

            await setDoc(wishlistRef, { itemIds: newWishlist }, { merge: true });
            toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update wishlist");
        }
    };

    // Delete Listing
    const handleDeleteListing = async (itemId) => {
        if (!confirm("Are you sure you want to delete this listing?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'market_items', itemId));
            toast.success("Listing deleted successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete listing");
        }
    };

    // Report Item
    const handleReport = (item) => {
        setSelectedItem(item);
        setIsReportModalOpen(true);
    };

    // Handle Buy Now
    const handleBuy = () => {
        if (!user || !selectedItemDetail) return;
        if (selectedItemDetail.sellerId === user.uid) {
            toast.error("You cannot buy your own item!");
            return;
        }
        // Open Buy Now modal
        setIsBuyNowModalOpen(true);
    };

    const handleSubmitReport = async (reason) => {
        if (!user || !selectedItem) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'reports'), {
                itemId: selectedItem.id,
                itemTitle: selectedItem.title,
                reportedBy: user.uid,
                reason,
                createdAt: serverTimestamp()
            });
            toast.success("Report submitted. Thank you!");
            setIsReportModalOpen(false);
            setSelectedItem(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit report");
        }
    };

    return (
        <div className="animate-in fade-in pb-24 pt-4 px-4 max-w-7xl mx-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 z-20 pb-4 pt-2 -mx-4 px-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-gray-900 text-2xl font-bold">Campus Market</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsMyListingsOpen(true)}
                            className="bg-white p-2 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                        >
                            <ShoppingBag className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="bg-white p-2 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                        >
                            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search books, drafters..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar mb-4">
                    {['All', 'Books', 'Electronics', 'Stationery', 'Other'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price Range: ₹{priceRange.min} - ₹{priceRange.max}</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) || 0 })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) || 1000000 })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Grid */}
            {loading ? (
                <SkeletonGrid />
            ) : filteredAndSortedItems.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No items found. Be the first to sell!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredAndSortedItems.map((item) => (
                        <ProductCard
                            key={item.id}
                            item={item}
                            user={user}
                            onWishlistToggle={handleWishlistToggle}
                            isWishlisted={wishlist.includes(item.id)}
                            onReport={handleReport}
                            isOwner={item.sellerId === user?.uid}
                            isAdmin={isAdmin}
                            onDelete={() => handleDeleteListing(item.id)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItemDetail(item);
                                setIsItemDetailOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Post Ad FAB */}
            <button
                onClick={() => setIsPostModalOpen(true)}
                className="fixed bottom-24 right-6 md:bottom-10 md:right-10 bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-600/30 hover:scale-110 transition active:scale-95 z-30 flex items-center gap-2 pr-6"
            >
                <Plus className="w-6 h-6" /> <span className="hidden md:block font-bold">Post Ad</span>
            </button>

            {/* Post Ad Modal */}
            <PostAdModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                user={user}
                userData={userData}
            />

            {/* My Listings Modal */}
            <MyListingsModal
                isOpen={isMyListingsOpen}
                onClose={() => setIsMyListingsOpen(false)}
                listings={myListings}
                onDelete={handleDeleteListing}
                onEdit={(item) => {
                    setEditingItem(item);
                    setIsPostModalOpen(true);
                }}
            />

            {/* Report Modal */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => {
                    setIsReportModalOpen(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleSubmitReport}
                item={selectedItem}
            />

            {/* Edit Modal */}
            {editingItem && (
                <PostAdModal
                    isOpen={true}
                    onClose={() => {
                        setIsPostModalOpen(false);
                        setEditingItem(null);
                    }}
                    user={user}
                    userData={userData}
                    editingItem={editingItem}
                />
            )}

            {/* Item Detail Modal */}
            <ItemDetailModal
                isOpen={isItemDetailOpen}
                onClose={() => {
                    setIsItemDetailOpen(false);
                    setSelectedItemDetail(null);
                }}
                item={selectedItemDetail}
                user={user}
                userData={userData}
                onWishlistToggle={handleWishlistToggle}
                wishlist={wishlist}
                onReport={handleReport}
                onBuy={handleBuy}
            />

            {/* Buy Now Modal */}
            <BuyNowModal
                isOpen={isBuyNowModalOpen}
                onClose={() => {
                    setIsBuyNowModalOpen(false);
                    setSelectedItemDetail(null);
                }}
                item={selectedItemDetail}
                user={user}
                userData={userData}
            />
        </div>
    );
}

// Post Ad Modal Component
const PostAdModal = ({ isOpen, onClose, user, userData, editingItem }) => {
    const [formData, setFormData] = useState({
        title: '', price: '', category: 'Electronics', type: 'Sell', description: '', image: '', meetupLocation: '', meetupLat: '', meetupLng: '', quantity: 1
    });
    const [submitting, setSubmitting] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [mapPickerLocation, setMapPickerLocation] = useState({ lat: null, lng: null, name: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                title: editingItem.title || '',
                price: editingItem.price || '',
                category: editingItem.category || 'Electronics',
                type: editingItem.type || 'Sell',
                description: editingItem.description || '',
                image: editingItem.image || '',
                meetupLocation: editingItem.meetupLocation || '',
                meetupLat: editingItem.meetupLat || '',
                meetupLng: editingItem.meetupLng || '',
                quantity: editingItem.quantity || 1
            });
            if (editingItem.meetupLat && editingItem.meetupLng) {
                setMapPickerLocation({
                    lat: editingItem.meetupLat,
                    lng: editingItem.meetupLng,
                    name: editingItem.meetupLocation || ''
                });
            }
        } else {
            setFormData({ title: '', price: '', category: 'Electronics', type: 'Sell', description: '', image: '', meetupLocation: '', meetupLat: '', meetupLng: '', quantity: 1 });
            setMapPickerLocation({ lat: null, lng: null, name: '' });
        }
    }, [editingItem]);

    if (!isOpen) return null;

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file && file.size < 500000) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData({ ...formData, image: reader.result });
            reader.readAsDataURL(file);
        } else {
            toast.error("Image too large! Max 500KB.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingItem) {
                // Update existing item
                const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'market_items', editingItem.id);
                await updateDoc(itemRef, {
                    ...formData,
                    price: Number(formData.price),
                    quantity: Number(formData.quantity) || 1,
                    meetupLat: formData.meetupLat || '',
                    meetupLng: formData.meetupLng || '',
                    updatedAt: serverTimestamp()
                });
                toast.success("Listing updated successfully!");
            } else {
                // Create new item
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'market_items'), {
                    ...formData,
                    sellerId: user.uid,
                    sellerName: userData?.name || 'Anonymous',
                    sellerEmail: userData?.email || user?.email || '',
                    meetupLocation: formData.meetupLocation || '',
                    meetupLat: formData.meetupLat || '',
                    meetupLng: formData.meetupLng || '',
                    createdAt: serverTimestamp(),
                    price: Number(formData.price),
                    quantity: Number(formData.quantity) || 1
                });
                toast.success("Item posted successfully!");
            }
            onClose();
            setFormData({ title: '', price: '', category: 'Electronics', type: 'Sell', description: '', image: '', meetupLocation: '', meetupLat: '', meetupLng: '', quantity: 1 });
            setMapPickerLocation({ lat: null, lng: null, name: '' });
            setShowMapPicker(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to post ad.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">{editingItem ? 'Edit Listing' : 'Create Listing'}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition cursor-pointer relative overflow-hidden"
                    >
                        {formData.image && formData.image.trim() !== '' ? (
                            <img src={formData.image} className="w-full h-full object-contain" alt="Preview" />
                        ) : (
                            <>
                                <Camera className="w-8 h-8 mb-2" />
                                <span className="text-xs font-bold">Add Photo</span>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImage} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        💡 Suggested size: 800×600 pixels (Images of other sizes will display without zooming)
                    </p>

                    <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
                        {['Sell', 'Rent', 'Donate'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setFormData({ ...formData, type: t })}
                                className={`text-xs font-bold py-2 rounded-md transition ${formData.type === t ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500" placeholder="e.g. Drafter" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (₹)</label>
                            <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500" placeholder="0" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
                            <input type="number" min="1" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500" placeholder="1" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500">
                                <option>Electronics</option><option>Books</option><option>Stationery</option><option>Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows="3"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none"
                            placeholder="Describe your item..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            Safe Meet-up Location (Optional)
                        </label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={formData.meetupLocation}
                                onChange={e => setFormData({ ...formData, meetupLocation: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                                placeholder="e.g. Library Entrance, Cafeteria, Main Gate"
                            />
                            <button
                                type="button"
                                onClick={() => setShowMapPicker(true)}
                                className="w-full bg-blue-50 border-2 border-blue-200 text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm"
                            >
                                <MapPin className="w-4 h-4" />
                                Pick Location on Map
                            </button>
                            {(formData.meetupLat && formData.meetupLng) && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700">
                                    ✓ Location pinned: {parseFloat(formData.meetupLat).toFixed(6)}, {parseFloat(formData.meetupLng).toFixed(6)}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Suggest a safe public location for meet-up</p>
                    </div>

                    {/* Map Picker Modal */}
                    {showMapPicker && (
                        <MapPickerModal
                            isOpen={showMapPicker}
                            onClose={() => setShowMapPicker(false)}
                            onSelect={(location) => {
                                setFormData({
                                    ...formData,
                                    meetupLocation: location.name,
                                    meetupLat: location.lat,
                                    meetupLng: location.lng
                                });
                                setMapPickerLocation(location);
                                setShowMapPicker(false);
                            }}
                            initialLocation={mapPickerLocation}
                        />
                    )}

                    <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition flex justify-center">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingItem ? "Update Item" : "Post Item")}
                    </button>
                </form>
            </div>
        </div>
    );
};

// My Listings Modal
const MyListingsModal = ({ isOpen, onClose, listings, onDelete, onEdit }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">My Listings ({listings.length})</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {listings.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>You haven't posted any listings yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {listings.map((item) => (
                                <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                            {item.image && item.image.trim() !== '' ? (
                                                <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{item.title}</h4>
                                            <p className="text-blue-600 font-bold text-lg mb-2">₹{item.price}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1"
                                                >
                                                    <Edit3 className="w-3 h-3" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition flex items-center justify-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Report Modal
const ReportModal = ({ isOpen, onClose, onSubmit, item }) => {
    const [reason, setReason] = useState('');
    const reasons = ['Spam', 'Inappropriate', 'Sold but active', 'Wrong information', 'Other'];

    if (!isOpen || !item) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason) {
            toast.error("Please select a reason");
            return;
        }
        onSubmit(reason);
        setReason('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Report Item</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 mb-4">Why are you reporting "{item.title}"?</p>
                    <div className="space-y-2">
                        {reasons.map((r) => (
                            <label key={r} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={r}
                                    checked={reason === r}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-700">{r}</span>
                            </label>
                        ))}
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition"
                    >
                        Submit Report
                    </button>
                </form>
            </div>
        </div>
    );
};

// Item Detail Modal Component with Buy, Share, Map, Trust Score
const ItemDetailModal = ({ isOpen, onClose, item, user, userData, onWishlistToggle, wishlist, onReport, onBuy }) => {
    const [sellerProfile, setSellerProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [trustScore, setTrustScore] = useState(4.5);

    useEffect(() => {
        if (isOpen && item?.sellerId) {
            fetchSellerProfile();
            calculateTrustScore();
        }
    }, [isOpen, item]);

    const fetchSellerProfile = async () => {
        setLoadingProfile(true);
        try {
            const profileRef = doc(db, 'artifacts', appId, 'users', item.sellerId, 'profile', 'data');
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
                setSellerProfile(profileSnap.data());
            }
        } catch (error) {
            console.error("Error fetching seller profile:", error);
        } finally {
            setLoadingProfile(false);
        }
    };

    const calculateTrustScore = async () => {
        try {
            let score = 3.0;
            if (item.sellerEmail && (item.sellerEmail.endsWith('@jec.ac.in') || item.sellerEmail.endsWith('@college.edu'))) {
                score += 0.5;
            }
            if (sellerProfile?.bio && sellerProfile?.skills) {
                score += 0.5;
            }
            score = Math.min(5.0, score + Math.random() * 1.0);
            setTrustScore(parseFloat(score.toFixed(1)));
        } catch (error) {
            console.error("Error calculating trust score:", error);
        }
    };


    const handleShare = async () => {
        const shareData = {
            title: item?.title,
            text: `Check out this item: ${item?.title} - ₹${item?.price}`,
            url: window.location.href
        };

        // Try native share first
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (error) {
                // User cancelled or share failed, fall through to clipboard
                if (error.name === 'AbortError') {
                    return; // User cancelled, don't show error
                }
            }
        }

        // Fallback to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
            } catch (error) {
                // Clipboard failed, show manual copy option
                console.error("Clipboard write failed:", error);
                // Fallback: show link in a prompt or use a textarea trick
                fallbackCopyToClipboard(window.location.href);
            }
        } else {
            // No clipboard support, use fallback
            fallbackCopyToClipboard(window.location.href);
        }
    };

    const fallbackCopyToClipboard = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            toast.success("Link copied to clipboard!");
        } catch (error) {
            console.error("Fallback copy failed:", error);
            toast.error("Could not copy link. Please copy manually: " + text.substring(0, 50) + "...");
        }
        document.body.removeChild(textArea);
    };

    const getMapUrl = (location, lat, lng) => {
        if (lat && lng) {
            return `https://www.google.com/maps?q=${lat},${lng}`;
        }
        if (!location) return null;
        const encoded = encodeURIComponent(location);
        return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    };

    const getEmbedMapUrl = (lat, lng) => {
        if (lat && lng) {
            return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6U4cO7xJZ4E&q=${lat},${lng}&zoom=15`;
        }
        return null;
    };

    if (!isOpen || !item) return null;

    const isOwner = item.sellerId === user?.uid;
    const isWishlisted = wishlist.includes(item.id);
    const typeColors = {
        'Sell': 'bg-blue-500/80',
        'Rent': 'bg-purple-500/80',
        'Donate': 'bg-green-500/80',
        'Exchange': 'bg-orange-500/80'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl my-8">
                <div className="relative">
                    {item.image && item.image.trim() !== '' ? (
                        <div className="h-64 md:h-80 bg-gray-100 overflow-hidden">
                            <img src={item.image} alt={item.title || 'Product image'} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-64 md:h-80 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <ShoppingBag className="w-24 h-24 text-white/30" />
                        </div>
                    )}
                    <button onClick={onClose} className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full hover:bg-white transition shadow-lg z-10">
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                    <button onClick={handleShare} className="absolute top-4 right-16 bg-white/90 backdrop-blur-md p-2 rounded-full hover:bg-white transition shadow-lg z-10">
                        <Share2 className="w-5 h-5 text-gray-700" />
                    </button>
                    <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md text-white ${typeColors[item.type] || 'bg-blue-500/80'}`}>
                        {item.type}
                    </span>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-20rem)]">
                    <div className="mb-6">
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{item.title}</h1>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-blue-600 font-bold text-3xl">₹{item.price}</span>
                                <span className="text-gray-500 text-sm">Category: {item.category}</span>
                            </div>
                            {!isOwner && (
                                <button onClick={() => onWishlistToggle(item.id)} className={`p-2 rounded-full transition ${isWishlisted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                            )}
                        </div>
                    </div>
                    {item.description && (
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                        </div>
                    )}
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Seller Information</h2>
                        {loadingProfile ? (
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
                                <div className="flex-1">
                                    <div className="h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                                    <img src={sellerProfile?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.sellerName}`} alt={item.sellerName} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-bold text-gray-900 text-lg">{item.sellerName}</h3>
                                        {item.sellerEmail && (item.sellerEmail.endsWith('@jec.ac.in') || item.sellerEmail.endsWith('@college.edu')) && (
                                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-sm font-bold text-yellow-700">Trust Score: {trustScore}</span>
                                        </div>
                                        <Shield className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-gray-600">Verified Seller</span>
                                    </div>
                                    {sellerProfile?.skills && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {sellerProfile.skills.split(',').slice(0, 3).map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold border border-gray-200">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {item.meetupLocation && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-2">Safe Meet-up Location</h3>
                                    <p className="text-gray-700 mb-3">{item.meetupLocation}</p>
                                    {(item.meetupLat && item.meetupLng) ? (
                                        <div className="space-y-3">
                                            <div className="w-full h-48 rounded-lg overflow-hidden border-2 border-blue-300">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    allowFullScreen
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6U4cO7xJZ4E&q=${item.meetupLat},${item.meetupLng}&zoom=16`}
                                                ></iframe>
                                            </div>
                                            <a href={getMapUrl(item.meetupLocation, item.meetupLat, item.meetupLng)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-700 transition">
                                                <MapPin className="w-4 h-4" />
                                                Open in Google Maps
                                            </a>
                                        </div>
                                    ) : (
                                        <a href={getMapUrl(item.meetupLocation)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-700 transition">
                                            <MapPin className="w-4 h-4" />
                                            View on Map
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {!isOwner ? (
                            <>
                                <button onClick={onBuy} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-lg">
                                    <ShoppingCart className="w-5 h-5" />
                                    {item.type === 'Rent' ? 'Rent Now' : item.type === 'Exchange' ? 'Request Exchange' : item.type === 'Donate' ? 'Request Item' : 'Buy Now'}
                                </button>
                                {item.sellerEmail && (
                                    <button onClick={() => {
                                        const subject = encodeURIComponent(`Inquiry about ${item.title}`);
                                        const body = encodeURIComponent(`Hi ${item.sellerName},\n\nI'm interested in your "${item.title}".\n\nBest regards,\n${userData?.name || 'Student'}`);
                                        window.location.href = `mailto:${item.sellerEmail}?subject=${subject}&body=${body}`;
                                    }} className="flex-1 bg-white border-2 border-blue-600 text-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-2 text-lg">
                                        <MessageCircle className="w-5 h-5" />
                                        Contact Seller
                                    </button>
                                )}
                                <button onClick={() => onReport(item)} className="px-4 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition">
                                    <Flag className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <div className="w-full bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                                <p className="text-green-900 font-bold">This is your listing. Share it to find buyers!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Buy Now Modal Component with Payment Method Selection
const BuyNowModal = ({ isOpen, onClose, item, user, userData }) => {
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [step, setStep] = useState(1); // 1: Payment, 2: Confirmation, 3: Order Created
    const [sellerProfile, setSellerProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [orderCreated, setOrderCreated] = useState(null);

    useEffect(() => {
        if (isOpen && item?.sellerId) {
            fetchSellerProfile();
        }
        if (!isOpen) {
            setStep(1);
            setPaymentMethod('cod');
            setOrderCreated(null);
        }
    }, [isOpen, item]);

    const fetchSellerProfile = async () => {
        try {
            const profileRef = doc(db, 'artifacts', appId, 'users', item.sellerId, 'profile', 'data');
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
                setSellerProfile(profileSnap.data());
            }
        } catch (error) {
            console.error("Error fetching seller profile:", error);
        }
    };

    const generateOTP = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };

    const handleConfirmOrder = async () => {
        if (!user || !item) return;

        setLoading(true);
        try {
            const deliveryOtp = generateOTP();

            // Create order in Firestore
            const orderRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), {
                buyerId: user.uid,
                buyerName: userData?.name || 'Anonymous',
                sellerId: item.sellerId,
                sellerName: item.sellerName,
                itemId: item.id,
                itemTitle: item.title,
                itemImage: item.image || '',
                amount: item.price,
                paymentMethod,
                status: 'pending_meetup',
                deliveryOtp,
                meetupLocation: item.meetupLocation || '',
                createdAt: serverTimestamp(),
                completedAt: null
            });

            // Decrement Quantity
            const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'market_items', item.id);
            const currentQuantity = item.quantity || 1;
            if (currentQuantity > 0) {
                await updateDoc(itemRef, {
                    quantity: currentQuantity - 1
                });
            }

            // Send notification to seller
            const notificationRef = collection(db, 'artifacts', appId, 'users', item.sellerId, 'notifications');
            await addDoc(notificationRef, {
                type: 'new_order',
                fromUserId: user.uid,
                fromUserName: userData?.name || 'Anonymous',
                orderId: orderRef.id,
                itemTitle: item.title,
                amount: item.price,
                message: `${userData?.name || 'Someone'} wants to purchase your "${item.title}" for ₹${item.price}`,
                createdAt: serverTimestamp(),
                read: false
            });

            setOrderCreated({ id: orderRef.id, otp: deliveryOtp });
            setStep(3);
            toast.success("Order created successfully!");
        } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">
                        {step === 1 && 'Select Payment Method'}
                        {step === 2 && 'Confirm Order'}
                        {step === 3 && 'Order Created!'}
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="p-6">
                    {/* Step 1: Payment Method Selection */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-600 font-medium">{item.title}</span>
                                    <span className="text-blue-600 font-bold text-lg">₹{item.price}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">Choose Payment Method</label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 transition">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-5 h-5 text-blue-600"
                                        />
                                        <CreditCard className="w-5 h-5 text-gray-600" />
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900">Cash on Delivery</div>
                                            <div className="text-xs text-gray-500">Pay when you meet the seller</div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 transition">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="upi"
                                            checked={paymentMethod === 'upi'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-5 h-5 text-blue-600"
                                        />
                                        <QrCode className="w-5 h-5 text-gray-600" />
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900">UPI / QR Pay</div>
                                            <div className="text-xs text-gray-500">Pay via UPI before meeting</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {paymentMethod === 'upi' && sellerProfile?.upiId && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                    <div className="text-xs font-bold text-blue-700 uppercase mb-2">Seller UPI ID</div>
                                    <div className="font-mono text-lg font-bold text-blue-900 mb-3">{sellerProfile.upiId}</div>
                                    <div className="bg-white p-4 rounded-lg border border-blue-200 flex items-center justify-center">
                                        <div className="text-center">
                                            <QrCode className="w-24 h-24 text-gray-400 mx-auto mb-2" />
                                            <div className="text-xs text-gray-500">QR Code Placeholder</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'upi' && !sellerProfile?.upiId && (
                                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                                    Seller hasn't added UPI ID. Please contact them directly.
                                </div>
                            )}

                            <button
                                onClick={() => setStep(2)}
                                disabled={paymentMethod === 'upi' && !sellerProfile?.upiId}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* Step 2: Confirmation */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-3">Order Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Item:</span>
                                        <span className="font-bold">{item.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Price:</span>
                                        <span className="font-bold">₹{item.price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment:</span>
                                        <span className="font-bold">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Pay'}</span>
                                    </div>
                                    {item.meetupLocation && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Meet-up:</span>
                                            <span className="font-bold text-xs">{item.meetupLocation}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleConfirmOrder}
                                    disabled={loading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:bg-gray-300"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Confirm Order
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Order Created with OTP */}
                    {step === 3 && orderCreated && (
                        <div className="space-y-4 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900">Order Confirmed!</h3>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                                <div className="text-xs font-bold text-blue-700 uppercase mb-3">Your Delivery OTP</div>
                                <div className="text-5xl font-black text-blue-900 mb-3 tracking-wider">{orderCreated.otp}</div>
                                <div className="text-sm text-blue-800 font-medium">
                                    Share this OTP <span className="font-black">ONLY</span> after you receive the item
                                </div>
                            </div>

                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-left">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <div className="font-bold mb-1">Important:</div>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>Meet the seller at the suggested location</li>
                                            <li>Verify the item before sharing the OTP</li>
                                            <li>Only share OTP after receiving the item</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Map Picker Modal Component
const MapPickerModal = ({ isOpen, onClose, onSelect, initialLocation }) => {
    const [locationName, setLocationName] = useState(initialLocation?.name || '');
    const [coordinates, setCoordinates] = useState({ lat: initialLocation?.lat || null, lng: initialLocation?.lng || null });
    const [searchQuery, setSearchQuery] = useState('');
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        if (initialLocation?.lat && initialLocation?.lng) {
            setCoordinates({ lat: initialLocation.lat, lng: initialLocation.lng });
        }
    }, [initialLocation]);

    const handleGetCurrentLocation = () => {
        setGettingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setCoordinates({ lat, lng });
                    setGettingLocation(false);
                    toast.success("Location captured!");
                },
                (error) => {
                    console.error("Error getting location:", error);
                    toast.error("Could not get your location. Please allow location access.");
                    setGettingLocation(false);
                }
            );
        } else {
            toast.error("Geolocation is not supported by your browser.");
            setGettingLocation(false);
        }
    };

    const handleSearchLocation = () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a location name");
            return;
        }
        const encoded = encodeURIComponent(searchQuery);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
        toast.success("Search opened in Google Maps. Please copy coordinates manually or use 'Get Current Location'.");
    };

    const handleConfirm = () => {
        if (!coordinates.lat || !coordinates.lng) {
            toast.error("Please select a location first");
            return;
        }
        onSelect({
            lat: coordinates.lat,
            lng: coordinates.lng,
            name: locationName || searchQuery || 'Selected Location'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Pick Location on Map</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Location Name</label>
                            <input
                                type="text"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                                placeholder="e.g. Library Entrance, Cafeteria"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={coordinates.lat || ''}
                                    onChange={(e) => setCoordinates({ ...coordinates, lat: parseFloat(e.target.value) || null })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                                    placeholder="28.6139"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={coordinates.lng || ''}
                                    onChange={(e) => setCoordinates({ ...coordinates, lng: parseFloat(e.target.value) || null })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                                    placeholder="77.2090"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleGetCurrentLocation}
                                disabled={gettingLocation}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-300 flex items-center justify-center gap-2"
                            >
                                {gettingLocation ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Getting Location...
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-4 h-4" />
                                        Use Current Location
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Or Search Location</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                                    placeholder="Search for a place..."
                                />
                                <button
                                    type="button"
                                    onClick={handleSearchLocation}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 rounded-lg transition"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        {coordinates.lat && coordinates.lng && (
                            <div className="border-t border-gray-200 pt-3">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Preview Map</label>
                                <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-blue-300">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6U4cO7xJZ4E&q=${coordinates.lat},${coordinates.lng}&zoom=16`}
                                    ></iframe>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!coordinates.lat || !coordinates.lng}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
