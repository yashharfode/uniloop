'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Upload, FileText, Download, Clock, CheckCircle, XCircle,
    Filter, Search, BookOpen, GraduationCap, X, Loader2, AlertCircle, Link as LinkIcon, Image as ImageIcon
} from 'lucide-react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function Notes({ user, userData }) {
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'my-notes', 'upload'
    const [notes, setNotes] = useState([]);
    const [myNotes, setMyNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: 'General',
        driveLink: '',
        coverImage: ''
    });
    const coverImageInputRef = useRef(null);

    const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Programming', 'Electronics', 'Mechanical', 'Civil', 'General'];

    useEffect(() => {
        fetchApprovedNotes();
        if (user) {
            fetchMyNotes();
        }
    }, [user]);

    const fetchApprovedNotes = async () => {
        try {
            const notesRef = collection(db, 'artifacts', appId, 'public', 'data', 'notes');
            const q = query(notesRef, where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const fetchedNotes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotes(fetchedNotes);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notes:', error);
            toast.error('Failed to load notes');
            setLoading(false);
        }
    };

    const fetchMyNotes = async () => {
        try {
            const notesRef = collection(db, 'artifacts', appId, 'public', 'data', 'notes');
            const q = query(notesRef, where('uploadedBy', '==', user.uid), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const fetchedNotes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMyNotes(fetchedNotes);
        } catch (error) {
            console.error('Error fetching my notes:', error);
        }
    };

    const handleCoverImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 500KB for cover)
            if (file.size > 500000) {
                toast.error('Cover image too large! Max 500KB');
                return;
            }

            // Check aspect ratio (should be 16:9 or close to it)
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target.result;
                img.onload = () => {
                    const ratio = img.width / img.height;
                    // Accept ratios between 1.5 and 1.85 (16:9 is ~1.78)
                    if (ratio < 1.5 || ratio > 1.85) {
                        toast.error('Please use 16:9 aspect ratio image (e.g., 1920x1080)');
                        return;
                    }
                    setFormData(prev => ({ ...prev, coverImage: e.target.result }));
                    toast.success('Cover image added!');
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.driveLink) {
            toast.error('Please add Drive link');
            return;
        }

        setUploading(true);
        try {
            const notesRef = collection(db, 'artifacts', appId, 'public', 'data', 'notes');
            await addDoc(notesRef, {
                title: formData.title,
                description: formData.description,
                subject: formData.subject,
                driveLink: formData.driveLink,
                coverImage: formData.coverImage || '',
                uploadedBy: user.uid,
                uploadedByName: userData?.name || 'Unknown User',
                status: 'pending',
                createdAt: serverTimestamp()
            });

            toast.success('Note uploaded successfully! Waiting for admin approval.');
            setFormData({
                title: '',
                description: '',
                subject: 'General',
                driveLink: '',
                coverImage: ''
            });
            if (coverImageInputRef.current) {
                coverImageInputRef.current.value = '';
            }
            fetchMyNotes();
            setActiveTab('my-notes');
        } catch (error) {
            console.error('Error uploading note:', error);
            toast.error('Failed to upload note');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (note) => {
        try {
            if (note.driveLink) {
                window.open(note.driveLink, '_blank');
                toast.success('Opening Drive link!');
            } else {
                toast.error('No Drive link found');
            }
        } catch (error) {
            console.error('Error opening link:', error);
            toast.error('Failed to open link');
        }
    };

    const filteredNotes = notes.filter(note => {
        const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSubject && matchesSearch;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    <CheckCircle className="w-3 h-3" /> Approved
                </span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                    <XCircle className="w-3 h-3" /> Rejected
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
                    <GraduationCap className="w-8 h-8 text-blue-600" />
                    Study Notes
                </h1>
                <p className="text-gray-600">Share and access study materials from your peers</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 p-1 mb-6 flex gap-2">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    All Notes
                </button>
                <button
                    onClick={() => setActiveTab('my-notes')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'my-notes' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <FileText className="w-4 h-4 inline mr-2" />
                    My Notes
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Note
                </button>
            </div>

            {/* All Notes Tab */}
            {activeTab === 'all' && (
                <div>
                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search notes..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="md:w-48">
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {subjects.map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-500">Loading notes...</p>
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No notes found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredNotes.map(note => (
                                <div key={note.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
                                    {/* Cover Image */}
                                    {note.coverImage ? (
                                        <div className="h-40 bg-gray-100 overflow-hidden">
                                            <img src={note.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={note.title} />
                                        </div>
                                    ) : (
                                        <div className="h-40 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                                            <BookOpen className="w-16 h-16 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                                                {note.subject}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{note.title}</h3>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{note.description || 'No description'}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                            <span>By {note.uploadedByName}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(note)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2"
                                        >
                                            <LinkIcon className="w-4 h-4" />
                                            Open Drive Link
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* My Notes Tab */}
            {activeTab === 'my-notes' && (
                <div>
                    {myNotes.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">You haven't uploaded any notes yet</p>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                            >
                                Upload Your First Note
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myNotes.map(note => (
                                <div key={note.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    {/* Cover Image */}
                                    {note.coverImage ? (
                                        <div className="h-32 bg-gray-100 overflow-hidden">
                                            <img src={note.coverImage} className="w-full h-full object-cover" alt={note.title} />
                                        </div>
                                    ) : (
                                        <div className="h-32 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                                                {note.subject}
                                            </span>
                                            {getStatusBadge(note.status)}
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{note.title}</h3>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{note.description || 'No description'}</p>
                                        {note.status === 'approved' && (
                                            <button
                                                onClick={() => handleDownload(note)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2"
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                                Open Drive Link
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Study Note</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Calculus Formula Sheet"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Brief description of the content..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Subject *</label>
                            <select
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {subjects.filter(s => s !== 'All').map(subject => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Google Drive Link *</label>
                            <input
                                required
                                type="url"
                                value={formData.driveLink}
                                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://drive.google.com/file/d/..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Make sure the link has viewing permissions for everyone</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image (16:9 ratio, max 500KB)</label>
                            <div
                                onClick={() => coverImageInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
                            >
                                {formData.coverImage ? (
                                    <div className="space-y-2">
                                        <img src={formData.coverImage} className="w-full h-48 object-cover rounded-lg mx-auto" alt="Cover preview" />
                                        <p className="text-xs text-green-600 font-bold">✓ Cover image added</p>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Click to upload cover image</p>
                                        <p className="text-xs text-gray-500 mt-2">16:9 aspect ratio (e.g., 1920x1080)</p>
                                    </>
                                )}
                                <input
                                    ref={coverImageInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleCoverImageUpload}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-900">
                                    <p className="font-bold mb-1">Note:</p>
                                    <p>Your note will be reviewed by an admin before being published. This usually takes 24-48 hours.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Upload Note
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
