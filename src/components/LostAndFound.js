'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Search, MapPin, Calendar, X, Loader2, AlertCircle, Plus,
    Package, CheckCircle, XCircle, Clock, Image as ImageIcon, Phone, Mail
} from 'lucide-react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function LostAndFound({ user, userData }) {
    const [activeTab, setActiveTab] = useState('lost'); // 'lost', 'found', 'post'
    const [lostItems, setLostItems] = useState([]);
    const [foundItems, setFoundItems] = useState([]);
    const [myItems, setMyItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [formData, setFormData] = useState({
        type: 'lost',
        itemName: '',
        description: '',
        category: 'Electronics',
        location: '',
        date: '',
        contactInfo: '',
        image: ''
    });
    const imageInputRef = useRef(null);

    const categories = ['All', 'Electronics', 'Documents', 'Accessories', 'Bags', 'Keys', 'Other'];

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'lost_and_found');
            const q = query(itemsRef, where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setLostItems(allItems.filter(item => item.type === 'lost'));
            setFoundItems(allItems.filter(item => item.type === 'found'));

            if (user) {
                const myItemsData = allItems.filter(item => item.postedBy === user.uid);
                setMyItems(myItemsData);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching items:', error);
            toast.error('Failed to load items');
            setLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) {
                toast.error('Image too large! Max 500KB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
                toast.success('Image added!');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPosting(true);
        try {
            const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'lost_and_found');
            await addDoc(itemsRef, {
                ...formData,
                postedBy: user.uid,
                postedByName: userData?.name || 'Unknown User',
                status: 'pending',
                createdAt: serverTimestamp()
            });

            toast.success('Item posted! Waiting for admin approval.');
            setFormData({
                type: 'lost',
                itemName: '',
                description: '',
                category: 'Electronics',
                location: '',
                date: '',
                contactInfo: '',
                image: ''
            });
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
            setActiveTab(formData.type);
        } catch (error) {
            console.error('Error posting item:', error);
            toast.error('Failed to post item');
        } finally {
            setPosting(false);
        }
    };

    const displayItems = activeTab === 'lost' ? lostItems : foundItems;
    const filteredItems = displayItems.filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    <CheckCircle className="w-3 h-3" /> Active
                </span>;
            case 'resolved':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    <CheckCircle className="w-3 h-3" /> Resolved
                </span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                    <Clock className="w-3 h-3" /> Pending
                </span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 pt-4 px-4 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                    <Package className="w-8 h-8 text-orange-600" />
                    Lost & Found
                </h1>
                <p className="text-gray-600">Help others find their lost items or report what you've found</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 p-1 mb-6 flex gap-2">
                <button
                    onClick={() => setActiveTab('lost')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'lost' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <XCircle className="w-4 h-4 inline mr-2" />
                    Lost Items
                </button>
                <button
                    onClick={() => setActiveTab('found')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'found' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Found Items
                </button>
                <button
                    onClick={() => setActiveTab('post')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'post' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Post Item
                </button>
            </div>

            {/* Lost/Found Items View */}
            {(activeTab === 'lost' || activeTab === 'found') && (
                <div>
                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="md:w-48">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Items Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
                            <p className="text-gray-500">Loading items...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No {activeTab} items found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map(item => (
                                <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
                                    {item.image ? (
                                        <div className="h-40 bg-gray-100 overflow-hidden">
                                            <img src={item.image} className="w-full h-full object-cover" alt={item.itemName} />
                                        </div>
                                    ) : (
                                        <div className="h-40 bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
                                            <Package className="w-16 h-16 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                                                {item.category}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.type === 'lost' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                                }`}>
                                                {item.type === 'lost' ? 'LOST' : 'FOUND'}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2">{item.itemName}</h3>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                                        <div className="space-y-1 text-xs text-gray-500 mb-3">
                                            {item.location && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {item.location}
                                                </div>
                                            )}
                                            {item.date && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-500 mb-2">Contact: {item.postedByName}</p>
                                            {item.contactInfo && (
                                                <p className="text-xs text-blue-600 font-medium">{item.contactInfo}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Post Item Form */}
            {activeTab === 'post' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Post Item</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Type *</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'lost' })}
                                    className={`px-4 py-3 rounded-lg text-sm font-bold transition ${formData.type === 'lost' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <XCircle className="w-4 h-4 inline mr-2" />
                                    I Lost Something
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'found' })}
                                    className={`px-4 py-3 rounded-lg text-sm font-bold transition ${formData.type === 'found' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <CheckCircle className="w-4 h-4 inline mr-2" />
                                    I Found Something
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Item Name *</label>
                            <input
                                required
                                type="text"
                                value={formData.itemName}
                                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="e.g., iPhone 13, Black Wallet"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                placeholder="Describe the item in detail..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    {categories.filter(c => c !== 'All').map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Date {formData.type === 'lost' ? 'Lost' : 'Found'} *</label>
                                <input
                                    required
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Location *</label>
                            <input
                                required
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Where was it lost/found?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact Info *</label>
                            <input
                                required
                                type="text"
                                value={formData.contactInfo}
                                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Email or phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Item Image (Optional, max 500KB)</label>
                            <div
                                onClick={() => imageInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition"
                            >
                                {formData.image ? (
                                    <div className="space-y-2">
                                        <img src={formData.image} className="w-full max-h-48 object-contain rounded-lg mx-auto" alt="Preview" />
                                        <p className="text-xs text-green-600 font-bold">✓ Image added</p>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Click to upload image</p>
                                    </>
                                )}
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Suggested size: 800×600 pixels (Images of other sizes will display without zooming)
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-900">
                                    <p className="font-bold mb-1">Note:</p>
                                    <p>Your post will be reviewed by an admin before being published.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={posting}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {posting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Post Item
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
