'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Edit2, Trash2, Save, X, Shield, Lock,
    Calendar, MapPin, Users, Image as ImageIcon,
    Clock, Tag, AlertCircle, CheckCircle, FileText, Download, XCircle,
    UserPlus, Loader2
} from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import toast from 'react-hot-toast';

// ADMIN EMAILS - Sirf yeh emails wale users hi admin panel dekh sakte hain
const ADMIN_EMAILS = [
    'yash.harfode.sati@gmail.com',
    'yashharfode123@gmail.com'
];

const isAdminUser = (email) => ADMIN_EMAILS.includes(email);

export default function Admin({ user, userData }) {
    const [activeTab, setActiveTab] = useState('events'); // 'events' or 'users'
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Missing state variables
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        date: '',
        location: '',
        description: '',
        category: 'Tech',
        color: 'blue',
        attendees: 0,
        image: '',
        featured: false
    });

    // Banner State
    const [banners, setBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);
    const [isAddingBanner, setIsAddingBanner] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [bannerFormData, setBannerFormData] = useState({
        title: '',
        subtitle: '',
        cta: '',
        link: '',
        image: '',
        color: 'from-blue-900 to-slate-900',
        badge: 'FEATURED'
    });
    const bannerFileInputRef = useRef(null);

    // Notes State
    const [notes, setNotes] = useState([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [notesFilter, setNotesFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

    // Lost & Found State
    const [lostFoundItems, setLostFoundItems] = useState([]);
    const [lostFoundLoading, setLostFoundLoading] = useState(true);
    const [lostFoundFilter, setLostFoundFilter] = useState('all'); // 'all', 'pending', 'approved'

    // Scholarship State
    const [scholarships, setScholarships] = useState([]);
    const [scholarshipsLoading, setScholarshipsLoading] = useState(true);
    const [isAddingScholarship, setIsAddingScholarship] = useState(false);
    const [editingScholarship, setEditingScholarship] = useState(null);
    const [scholarshipFormData, setScholarshipFormData] = useState({
        title: '',
        description: '',
        amount: '',
        deadline: '',
        eligibility: '',
        website: '',
        provider: ''
    });

    // Admin Management State
    const [admins, setAdmins] = useState([]);
    const [adminsLoading, setAdminsLoading] = useState(true);
    const [newAdminEmail, setNewAdminEmail] = useState('');

    const fileInputRef = useRef(null);

    // Check if user is admin (hardcoded or from database)
    const [isDbAdmin, setIsDbAdmin] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);
    const isAdmin = isAdminUser(user?.email) || isAdminUser(userData?.email) || isDbAdmin;

    // Check if user is admin from database
    useEffect(() => {
        const checkDbAdmin = async () => {
            if (!user?.email) {
                setAdminCheckLoading(false);
                return;
            }

            try {
                const adminsRef = collection(db, 'artifacts', appId, 'admins');
                const snapshot = await getDocs(adminsRef);
                const adminEmails = snapshot.docs.map(doc => doc.data().email);
                setIsDbAdmin(adminEmails.includes(user.email.toLowerCase()));
            } catch (error) {
                console.error('Error checking admin status:', error);
            } finally {
                setAdminCheckLoading(false);
            }
        };

        checkDbAdmin();
    }, [user?.email]);

    useEffect(() => {
        if (isAdmin) {
            fetchEvents();
            fetchUsers();
            fetchBanners();
            fetchNotes();
            fetchLostFoundItems();
            fetchScholarships();
            fetchAdmins();
        }
    }, [isAdmin]);

    const fetchEvents = async () => {
        try {
            const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
            const snapshot = await getDocs(eventsRef);
            const fetchedEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(fetchedEvents);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
            setLoading(false);
        }
    };

    const fetchBanners = async () => {
        try {
            const bannersRef = collection(db, 'artifacts', appId, 'public', 'data', 'banners');
            const snapshot = await getDocs(bannersRef);
            const fetchedBanners = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBanners(fetchedBanners);
            setBannersLoading(false);
        } catch (error) {
            console.error('Error fetching banners:', error);
            toast.error('Failed to load banners');
            setBannersLoading(false);
        }
    };

    const handleBannerImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) {
                toast.error('Image too large! Max 500KB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerSubmit = async (e) => {
        e.preventDefault();
        try {
            const bannersRef = collection(db, 'artifacts', appId, 'public', 'data', 'banners');

            const bannerData = {
                ...bannerFormData,
                createdAt: serverTimestamp()
            };

            if (editingBanner) {
                const bannerDoc = doc(db, 'artifacts', appId, 'public', 'data', 'banners', editingBanner.id);
                await updateDoc(bannerDoc, bannerData);
                toast.success('Banner updated successfully!');
            } else {
                await addDoc(bannersRef, bannerData);
                toast.success('Banner added successfully!');
            }

            setBannerFormData({
                title: '',
                subtitle: '',
                cta: '',
                link: '',
                image: '',
                color: 'from-blue-900 to-slate-900',
                badge: 'FEATURED'
            });
            setIsAddingBanner(false);
            setEditingBanner(null);
            fetchBanners();
        } catch (error) {
            console.error('Error saving banner:', error);
            toast.error('Failed to save banner');
        }
    };

    const handleDeleteBanner = async (bannerId) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;
        try {
            const bannerDoc = doc(db, 'artifacts', appId, 'public', 'data', 'banners', bannerId);
            await deleteDoc(bannerDoc);
            toast.success('Banner deleted successfully!');
            fetchBanners();
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast.error('Failed to delete banner');
        }
    };

    const handleEditBanner = (banner) => {
        setEditingBanner(banner);
        setBannerFormData({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            cta: banner.cta || '',
            link: banner.link || '',
            image: banner.image || '',
            color: banner.color || 'from-blue-900 to-slate-900',
            badge: banner.badge || 'FEATURED'
        });
        setIsAddingBanner(true);
    };

    const fetchNotes = async () => {
        try {
            const notesRef = collection(db, 'artifacts', appId, 'public', 'data', 'notes');
            const snapshot = await getDocs(notesRef);
            const fetchedNotes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotes(fetchedNotes);
            setNotesLoading(false);
        } catch (error) {
            console.error('Error fetching notes:', error);
            toast.error('Failed to load notes');
            setNotesLoading(false);
        }
    };

    const handleApproveNote = async (noteId) => {
        try {
            const noteDoc = doc(db, 'artifacts', appId, 'public', 'data', 'notes', noteId);
            await updateDoc(noteDoc, {
                status: 'approved',
                approvedAt: serverTimestamp(),
                approvedBy: user.uid
            });
            toast.success('Note approved successfully!');
            fetchNotes();
        } catch (error) {
            console.error('Error approving note:', error);
            toast.error('Failed to approve note');
        }
    };

    const handleRejectNote = async (noteId) => {
        if (!window.confirm('Are you sure you want to reject this note?')) return;
        try {
            const noteDoc = doc(db, 'artifacts', appId, 'public', 'data', 'notes', noteId);
            await updateDoc(noteDoc, {
                status: 'rejected'
            });
            toast.success('Note rejected');
            fetchNotes();
        } catch (error) {
            console.error('Error rejecting note:', error);
            toast.error('Failed to reject note');
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Are you sure you want to delete this note permanently?')) return;
        try {
            const noteDoc = doc(db, 'artifacts', appId, 'public', 'data', 'notes', noteId);
            await deleteDoc(noteDoc);
            toast.success('Note deleted successfully!');
            fetchNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('Failed to delete note');
        }
    };

    const handleDownloadNote = (note) => {
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

    // Lost & Found Functions
    const fetchLostFoundItems = async () => {
        try {
            const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'lost_and_found');
            const snapshot = await getDocs(itemsRef);
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLostFoundItems(items);
            setLostFoundLoading(false);
        } catch (error) {
            console.error('Error fetching lost & found items:', error);
            toast.error('Failed to load items');
            setLostFoundLoading(false);
        }
    };

    const approveLostFoundItem = async (itemId) => {
        try {
            const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'lost_and_found', itemId);
            await updateDoc(itemRef, {
                status: 'approved',
                approvedAt: serverTimestamp(),
                approvedBy: user.uid
            });
            toast.success('Item approved!');
            fetchLostFoundItems();
        } catch (error) {
            console.error('Error approving item:', error);
            toast.error('Failed to approve item');
        }
    };

    const deleteLostFoundItem = async (itemId) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'lost_and_found', itemId));
            toast.success('Item deleted');
            fetchLostFoundItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('Failed to delete item');
        }
    };

    // Scholarship Functions
    const fetchScholarships = async () => {
        try {
            const scholarshipsRef = collection(db, 'artifacts', appId, 'public', 'data', 'scholarships');
            const snapshot = await getDocs(scholarshipsRef);
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setScholarships(items);
            setScholarshipsLoading(false);
        } catch (error) {
            console.error('Error fetching scholarships:', error);
            setScholarshipsLoading(false);
        }
    };

    const handleAddScholarship = async () => {
        try {
            if (editingScholarship) {
                // Update existing scholarship
                const scholarshipRef = doc(db, 'artifacts', appId, 'public', 'data', 'scholarships', editingScholarship.id);
                await updateDoc(scholarshipRef, {
                    ...scholarshipFormData,
                    updatedAt: serverTimestamp()
                });
                toast.success('Scholarship updated!');
            } else {
                // Add new scholarship
                const scholarshipsRef = collection(db, 'artifacts', appId, 'public', 'data', 'scholarships');
                await addDoc(scholarshipsRef, { ...scholarshipFormData, createdAt: serverTimestamp(), createdBy: user.uid });
                toast.success('Scholarship added!');
            }
            setScholarshipFormData({ title: '', description: '', amount: '', deadline: '', eligibility: '', website: '', provider: '' });
            setIsAddingScholarship(false);
            setEditingScholarship(null);
            fetchScholarships();
        } catch (error) {
            console.error('Error saving scholarship:', error);
            toast.error(editingScholarship ? 'Failed to update scholarship' : 'Failed to add scholarship');
        }
    };

    const handleEditScholarship = (scholarship) => {
        setEditingScholarship(scholarship);
        setScholarshipFormData({
            title: scholarship.title || '',
            description: scholarship.description || '',
            amount: scholarship.amount || '',
            deadline: scholarship.deadline || '',
            eligibility: scholarship.eligibility || '',
            website: scholarship.website || '',
            provider: scholarship.provider || ''
        });
        setIsAddingScholarship(true);
    };

    const handleDeleteScholarship = async (id) => {
        if (!confirm('Delete this scholarship?')) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'scholarships', id));
            toast.success('Scholarship deleted');
            fetchScholarships();
        } catch (error) {
            toast.error('Failed to delete scholarship');
        }
    };

    // Admin Management Functions
    const fetchAdmins = async () => {
        try {
            const adminsRef = collection(db, 'artifacts', appId, 'admins');
            const snapshot = await getDocs(adminsRef);
            const adminsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAdmins(adminsList);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setAdminsLoading(false);
        }
    };

    const handleGrantAdmin = async () => {
        if (!newAdminEmail || !newAdminEmail.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        if (!newAdminEmail.includes('@')) {
            toast.error('Please enter a valid email');
            return;
        }

        try {
            const adminsRef = collection(db, 'artifacts', appId, 'admins');
            await addDoc(adminsRef, {
                email: newAdminEmail.trim().toLowerCase(),
                grantedBy: user.email,
                grantedAt: serverTimestamp()
            });
            toast.success(`Admin access granted to ${newAdminEmail}`);
            setNewAdminEmail('');
            fetchAdmins();
        } catch (error) {
            console.error('Error granting admin access:', error);
            toast.error('Failed to grant admin access');
        }
    };

    const handleRevokeAdmin = async (adminId, adminEmail) => {
        // Prevent self-deletion
        if (adminEmail === user.email) {
            toast.error('You cannot remove yourself as admin');
            return;
        }

        if (!confirm(`Revoke admin access for ${adminEmail}?`)) return;

        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'admins', adminId));
            toast.success('Admin access revoked');
            fetchAdmins();
        } catch (error) {
            console.error('Error revoking admin:', error);
            toast.error('Failed to revoke admin access');
        }
    };

    const fetchUsers = async () => {
        try {
            // Use collectionGroup to query all profile/data documents
            // Note: This requires a composite index in Firestore if filtering/sorting, but basic fetch is fine
            // Path: artifacts/{appId}/users/{userId}/profile/data
            // We need to query 'profile' collection group where the document ID is 'data' (usually) 
            // OR just query collectionGroup('profile') and filter by path

            // Actually, the collection name is 'profile', and the doc is 'data'. 
            // So we query collectionGroup('profile') and get the 'data' doc inside it? 
            // Wait, collectionGroup queries COLLECTIONS with that name.
            // Our structure: artifacts/{appId}/users/{userId}/profile/data
            // So 'profile' is a collection. 'data' is a doc.
            // If we query collectionGroup('profile'), we get documents INSIDE 'profile' collections.
            // The document inside 'profile' is 'data'.

            const usersQuery = collectionGroup(db, 'profile');
            const snapshot = await getDocs(usersQuery);

            const fetchedUsers = [];
            snapshot.forEach(docSnap => {
                // Check if it belongs to this app
                if (docSnap.ref.path.includes(appId)) {
                    const data = docSnap.data();
                    // Extract userId from path
                    const pathParts = docSnap.ref.path.split('/');
                    const userIdIndex = pathParts.indexOf('users');
                    const userId = userIdIndex !== -1 ? pathParts[userIdIndex + 1] : docSnap.id;

                    fetchedUsers.push({
                        id: userId,
                        ...data
                    });
                }
            });

            setUsers(fetchedUsers);
            setUsersLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
            setUsersLoading(false);
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
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');

            const eventData = {
                ...formData,
                attendees: parseInt(formData.attendees) || 0,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                createdByName: userData?.name || 'Admin'
            };

            if (editingEvent) {
                // Update existing event
                const eventDoc = doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEvent.id);
                await updateDoc(eventDoc, eventData);
                toast.success('Event updated successfully!');
            } else {
                // Add new event
                await addDoc(eventsRef, eventData);
                toast.success('Event added successfully!');
            }

            setFormData({
                title: '',
                type: '',
                date: '',
                location: '',
                description: '',
                category: 'Tech',
                color: 'blue',
                attendees: 0,
                image: '',
                featured: false
            });
            setIsAddingEvent(false);
            setEditingEvent(null);
            fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            toast.error('Failed to save event');
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            title: event.title || '',
            type: event.type || '',
            date: event.date || '',
            location: event.location || '',
            description: event.description || '',
            category: event.category || 'Tech',
            color: event.color || 'blue',
            attendees: event.attendees || 0,
            image: event.image || '',
            featured: event.featured || false
        });
        setIsAddingEvent(true);
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            const eventDoc = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
            await deleteDoc(eventDoc);
            toast.success('Event deleted successfully!');
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Failed to delete event');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            // Construct the path to the user's profile data document
            // Path: artifacts/{appId}/users/{userId}/profile/data
            const userDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');

            await deleteDoc(userDocRef);

            // Update local state
            setUsers(users.filter(user => user.id !== userId));
            toast.success('User deleted successfully');

            // If the deleted user was selected in the modal, close it
            if (selectedUser && selectedUser.id === userId) {
                setIsUserModalOpen(false);
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    const handleCancel = () => {
        setIsAddingEvent(false);
        setEditingEvent(null);
        setFormData({
            title: '',
            type: '',
            date: '',
            location: '',
            description: '',
            category: 'Tech',
            color: 'blue',
            attendees: 0,
            image: '',
            featured: false
        });
    };

    // Show loading while checking admin status
    if (adminCheckLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
                    <p className="text-white text-lg font-semibold">Checking access...</p>
                </div>
            </div>
        );
    }

    // If not admin, show access denied
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
                    <p className="text-gray-600 mb-6">You don't have permission to access the Admin Panel.</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="text-left">
                                <p className="text-sm font-semibold text-yellow-900 mb-1">Admin Access Required</p>
                                <p className="text-xs text-yellow-800">Only authorized administrators can manage events.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-24 px-4 md:px-6 pt-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900">Quantum Control</h1>
                            <p className="text-gray-600">Manage events and users</p>
                        </div>
                    </div>
                    {activeTab === 'events' && (
                        <button
                            onClick={() => setIsAddingEvent(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add Event
                        </button>
                    )}
                    {activeTab === 'banners' && (
                        <button
                            onClick={() => setIsAddingBanner(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add Banner
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    {/* Admin Badge */}
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-bold">Logged in as Admin</span>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'events' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Events
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'users' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Users ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('banners')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'banners' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Banners
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'notes' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Notes
                        </button>
                        <button
                            onClick={() => setActiveTab('lostfound')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'lostfound' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Lost & Found
                        </button>
                        <button
                            onClick={() => setActiveTab('scholarships')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'scholarships' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Scholarships
                        </button>
                        <button
                            onClick={() => setActiveTab('admins')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'admins' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Admins
                        </button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Event Form */}
            {isAddingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-xl text-gray-900">
                                {editingEvent ? 'Edit Event' : 'Add New Event'}
                            </h3>
                            <button onClick={handleCancel}>
                                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Event Image</label>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition relative overflow-hidden"
                                >
                                    {formData.image ? (
                                        <img src={formData.image} className="w-full h-full object-contain" alt="Preview" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500">Click to upload image</span>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        💡 Suggested size: 1200×600 pixels (Images of other sizes will display without zooming)
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Event Title *</label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., Hackathon Night"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Event Type *</label>
                                    <input
                                        required
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., Workshop, Competition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Date & Time *</label>
                                    <input
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., Dec 5, 3 PM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Location *</label>
                                    <input
                                        required
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., CS Lab 301"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    placeholder="Event description..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option>Tech</option>
                                        <option>Arts</option>
                                        <option>Business</option>
                                        <option>Cultural</option>
                                        <option>Sports</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Color</label>
                                    <select
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="blue">Blue</option>
                                        <option value="orange">Orange</option>
                                        <option value="green">Green</option>
                                        <option value="purple">Purple</option>
                                        <option value="pink">Pink</option>
                                        <option value="yellow">Yellow</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Attendees</label>
                                    <input
                                        type="number"
                                        value={formData.attendees}
                                        onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="featured"
                                    checked={formData.featured}
                                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                                <label htmlFor="featured" className="text-sm font-bold text-gray-700">Mark as Featured Event</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition"
                                >
                                    <Save className="w-5 h-5 inline mr-2" />
                                    {editingEvent ? 'Update Event' : 'Add Event'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Banner Modal */}
            {isAddingBanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-xl text-gray-900">
                                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                            </h3>
                            <button onClick={() => { setIsAddingBanner(false); setEditingBanner(null); }}>
                                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>

                        <form onSubmit={handleBannerSubmit} className="p-6 space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Banner Image</label>
                                <div
                                    onClick={() => bannerFileInputRef.current.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition relative overflow-hidden"
                                >
                                    {bannerFormData.image ? (
                                        <img src={bannerFormData.image} className="w-full h-full object-contain" alt="Preview" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500">Click to upload image</span>
                                        </>
                                    )}
                                    <input
                                        ref={bannerFileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleBannerImageUpload}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        💡 Suggested size: 1920×600 pixels (Images of other sizes will display without zooming)
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
                                    <input
                                        required
                                        value={bannerFormData.title}
                                        onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., Hackathon 2025"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Subtitle *</label>
                                    <input
                                        required
                                        value={bannerFormData.subtitle}
                                        onChange={(e) => setBannerFormData({ ...bannerFormData, subtitle: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., Win big prizes!"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">CTA Text</label>
                                    <input
                                        value={bannerFormData.cta}
                                        onChange={(e) => setBannerFormData({ ...bannerFormData, cta: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., Register Now"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Badge Text</label>
                                    <input
                                        value={bannerFormData.badge}
                                        onChange={(e) => setBannerFormData({ ...bannerFormData, badge: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., FEATURED"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Gradient Color</label>
                                <select
                                    value={bannerFormData.color}
                                    onChange={(e) => setBannerFormData({ ...bannerFormData, color: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="from-blue-900 to-slate-900">Blue Night</option>
                                    <option value="from-purple-900 to-indigo-900">Purple Haze</option>
                                    <option value="from-emerald-800 to-teal-900">Emerald City</option>
                                    <option value="from-rose-900 to-pink-900">Rose Garden</option>
                                    <option value="from-orange-800 to-red-900">Sunset</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition"
                                >
                                    <Save className="w-5 h-5 inline mr-2" />
                                    {editingBanner ? 'Update Banner' : 'Add Banner'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsAddingBanner(false); setEditingBanner(null); }}
                                    className="px-6 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {isUserModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                            <button
                                onClick={() => setIsUserModalOpen(false)}
                                className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/30 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 pb-6">
                            <div className="relative -mt-16 mb-4 flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                                    {selectedUser.profileImage ? (
                                        <img src={selectedUser.profileImage} className="w-full h-full object-cover" alt={selectedUser.name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                            <Users className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mt-2">{selectedUser.name}</h3>
                                <p className="text-blue-600 font-medium text-sm">@{selectedUser.username || 'username'}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Branch</p>
                                        <p className="font-bold text-gray-900">{selectedUser.branch || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Year</p>
                                        <p className="font-bold text-gray-900">{selectedUser.year || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Email</p>
                                    <p className="text-gray-900 text-sm font-medium">{selectedUser.email}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Bio</p>
                                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-xl">{selectedUser.bio || 'No bio available.'}</p>
                                </div>

                                <div className="pt-2">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Visibility</p>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${selectedUser.isVisibleInTeams !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {selectedUser.isVisibleInTeams !== false ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                        {selectedUser.isVisibleInTeams !== false ? 'Visible in Teams' : 'Hidden from Teams'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {activeTab === 'events' ? (
                /* Events List */
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">All Events ({events.length})</h2>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading events...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No events yet. Add your first event!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map(event => (
                                <div key={event.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition">
                                    {event.image && (
                                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{event.type}</span>
                                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-bold">{event.category}</span>
                                                    {event.featured && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">Featured</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" /> {event.date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" /> {event.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4" /> {event.attendees} attending
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : activeTab === 'banners' ? (
                /* Banners List */
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Homepage Banners ({banners.length})</h2>

                    {bannersLoading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading banners...</p>
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No banners yet. Add your first banner!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {banners.map(banner => (
                                <div key={banner.id} className={`relative rounded-2xl overflow-hidden shadow-lg aspect-[2/1] bg-gradient-to-r ${banner.color}`}>
                                    {banner.image && (
                                        <img src={banner.image} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                    )}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-center text-white z-10">
                                        <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded-full self-start mb-2">{banner.badge}</span>
                                        <h3 className="text-2xl font-bold mb-1">{banner.title}</h3>
                                        <p className="text-sm opacity-90 mb-4">{banner.subtitle}</p>
                                        <button className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold self-start">{banner.cta}</button>
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                                        <button onClick={() => handleEditBanner(banner)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md text-white transition">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteBanner(banner.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full backdrop-blur-md text-white transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : activeTab === 'notes' ? (
                /* Notes Review */
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Notes Management ({notes.length})</h2>
                        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setNotesFilter('all')}
                                className={`px-3 py-1 text-xs font-bold rounded transition ${notesFilter === 'all' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setNotesFilter('pending')}
                                className={`px-3 py-1 text-xs font-bold rounded transition ${notesFilter === 'pending' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setNotesFilter('approved')}
                                className={`px-3 py-1 text-xs font-bold rounded transition ${notesFilter === 'approved' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                            >
                                Approved
                            </button>
                            <button
                                onClick={() => setNotesFilter('rejected')}
                                className={`px-3 py-1 text-xs font-bold rounded transition ${notesFilter === 'rejected' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                            >
                                Rejected
                            </button>
                        </div>
                    </div>

                    {notesLoading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading notes...</p>
                        </div>
                    ) : notes.filter(n => notesFilter === 'all' || n.status === notesFilter).length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No {notesFilter !== 'all' ? notesFilter : ''} notes found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notes.filter(n => notesFilter === 'all' || n.status === notesFilter).map(note => (
                                <div key={note.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg mb-1">{note.title}</h3>
                                                    <div className="flex gap-2 mb-2">
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                                                            {note.subject}
                                                        </span>
                                                        {note.status === 'approved' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                                <CheckCircle className="w-3 h-3" /> Approved
                                                            </span>
                                                        )}
                                                        {note.status === 'rejected' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                                <XCircle className="w-3 h-3" /> Rejected
                                                            </span>
                                                        )}
                                                        {note.status === 'pending' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                                                <Clock className="w-3 h-3" /> Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{note.description || 'No description'}</p>
                                            <div className="flex gap-4 text-xs text-gray-500 mb-3">
                                                <span>Uploaded by: {note.uploadedByName}</span>
                                                <span>File: {note.fileName}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {note.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApproveNote(note.id)}
                                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition flex items-center gap-2"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectNote(note.id)}
                                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition flex items-center gap-2"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDownloadNote(note)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition flex items-center gap-2"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Preview
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-bold transition flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : activeTab === 'lostfound' ? (
                /* Lost & Found Management */
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Lost & Found Items</h2>
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setLostFoundFilter('all')} className={`px-3 py-1 text-xs font-bold rounded transition ${lostFoundFilter === 'all' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}>All</button>
                            <button onClick={() => setLostFoundFilter('pending')} className={`px-3 py-1 text-xs font-bold rounded transition ${lostFoundFilter === 'pending' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}>Pending</button>
                            <button onClick={() => setLostFoundFilter('approved')} className={`px-3 py-1 text-xs font-bold rounded transition ${lostFoundFilter === 'approved' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}>Approved</button>
                        </div>
                    </div>
                    {lostFoundLoading ? (
                        <div className="text-center py-12"><Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" /><p className="text-gray-500">Loading...</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {lostFoundItems.filter(item => lostFoundFilter === 'all' || item.status === lostFoundFilter).map(item => (
                                <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    {item.image && <img src={item.image} className="w-full h-32 object-cover rounded-lg mb-3" alt={item.itemName} />}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.type.toUpperCase()}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{item.status}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{item.itemName}</h3>
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                                    <p className="text-xs text-gray-500 mb-2">📍 {item.location} • 📅 {new Date(item.date).toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-500 mb-3">👤 {item.postedByName}</p>
                                    <div className="flex gap-2">
                                        {item.status === 'pending' && (
                                            <button onClick={() => approveLostFoundItem(item.id)} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition">Approve</button>
                                        )}
                                        <button onClick={() => deleteLostFoundItem(item.id)} className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : activeTab === 'scholarships' ? (
                /* Scholarship Management */
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Scholarships</h2>
                        {!isAddingScholarship && (
                            <button onClick={() => setIsAddingScholarship(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2">
                                <Plus className="w-5 h-5" /> Add Scholarship
                            </button>
                        )}
                    </div>

                    {isAddingScholarship && (
                        <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">{editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Title *" value={scholarshipFormData.title} onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, title: e.target.value })} className="border border-gray-300 rounded-lg p-3" />
                                <input type="text" placeholder="Provider" value={scholarshipFormData.provider} onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, provider: e.target.value })} className="border border-gray-300 rounded-lg p-3" />
                                <input type="text" placeholder="Amount (₹50,000)" value={scholarshipFormData.amount} onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, amount: e.target.value })} className="border border-gray-300 rounded-lg p-3" />
                                <input type="date" placeholder="Deadline" value={scholarshipFormData.deadline} onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, deadline: e.target.value })} className="border border-gray-300 rounded-lg p-3" />
                                <input type="url" placeholder="Website URL" value={scholarshipFormData.website} onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, website: e.target.value })} className="col-span-2 border border-gray-300 rounded-lg p-3" />
                                <textarea placeholder="Description" value={scholarshipFormData.description} onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, description: e.target.value })} className="col-span-2 border border-gray-300 rounded-lg p-3" rows="2"></textarea>
                                <textarea placeholder="Eligibility Criteria" value={scholarshipFormData.eligibility} onChange={(e) => setScholarshipFormData({ ...scholarshipFormData, eligibility: e.target.value })} className="col-span-2 border border-gray-300 rounded-lg p-3" rows="2"></textarea>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleAddScholarship} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition">
                                    {editingScholarship ? 'Update' : 'Save'}
                                </button>
                                <button onClick={() => { setIsAddingScholarship(false); setEditingScholarship(null); setScholarshipFormData({ title: '', description: '', amount: '', deadline: '', eligibility: '', website: '', provider: '' }); }} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition">Cancel</button>
                            </div>
                        </div>
                    )}

                    {scholarshipsLoading ? (
                        <div className="text-center py-12"><Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" /><p className="text-gray-500">Loading...</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {scholarships.map(scholarship => (
                                <div key={scholarship.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                                    <h3 className="font-bold text-gray-900 mb-2">{scholarship.title}</h3>
                                    <p className="text-sm text-gray-700 mb-2">{scholarship.provider}</p>
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{scholarship.description}</p>
                                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                                        <p>💰 {scholarship.amount}</p>
                                        <p>📅 Deadline: {new Date(scholarship.deadline).toLocaleDateString()}</p>
                                        <p className="line-clamp-1">✓ {scholarship.eligibility}</p>
                                    </div>
                                    {scholarship.website && (
                                        <a href={scholarship.website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mb-2 block">Visit Website →</a>
                                    )}
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleEditScholarship(scholarship)} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteScholarship(scholarship.id)} className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : activeTab === 'admins' ? (
                /* Admin Management */
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-indigo-600" />
                            Admin Management
                        </h2>
                    </div>

                    {/* Add Admin Form */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-600" />
                            Grant Admin Access
                        </h3>
                        <div className="flex gap-3">
                            <input
                                type="email"
                                placeholder="Enter email address"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleGrantAdmin()}
                                className="flex-1 border border-indigo-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleGrantAdmin}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Grant Access
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            💡 Tip: Enter the full email address of the user you want to make an admin
                        </p>
                    </div>

                    {/* Current Admins List */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-700" />
                            Current Admins ({admins.length + 2})
                        </h3>

                        {adminsLoading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                                <p className="text-gray-500">Loading admins...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Hardcoded Super Admins (Protected) */}
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">SA</div>
                                        <div>
                                            <p className="font-bold text-gray-900">{ADMIN_EMAILS[0]}</p>
                                            <p className="text-xs text-gray-600">Super Admin (Protected)</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Protected</span>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">SA</div>
                                        <div>
                                            <p className="font-bold text-gray-900">{ADMIN_EMAILS[1]}</p>
                                            <p className="text-xs text-gray-600">Super Admin (Protected)</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Protected</span>
                                </div>

                                {/* Dynamic Admins from Database */}
                                {admins.map((admin) => (
                                    <div key={admin.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                {admin.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{admin.email}</p>
                                                <p className="text-xs text-gray-500">
                                                    Added by {admin.grantedBy} •{' '}
                                                    {admin.grantedAt?.seconds ? new Date(admin.grantedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevokeAdmin(admin.id, admin.email)}
                                            disabled={admin.email === user.email}
                                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> Revoke
                                        </button>
                                    </div>
                                ))}

                                {admins.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <Shield className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm font-medium">No additional admins yet</p>
                                        <p className="text-xs mt-1">Use the form above to grant admin access</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Users List */
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">All Users ({users.length})</h2>

                    {usersLoading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No users found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">User</th>
                                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Branch/Year</th>
                                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                        {user.profileImage ? (
                                                            <img src={user.profileImage} className="w-full h-full object-cover" alt={user.name} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold">
                                                                {user.name ? user.name[0] : 'U'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                                        <p className="text-xs text-gray-500">@{user.username || 'username'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-gray-700">{user.branch || '-'}</p>
                                                <p className="text-xs text-gray-500">{user.year || '-'}</p>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                                            <td className="py-3 px-4">
                                                {user.isVisibleInTeams !== false ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                        <CheckCircle className="w-3 h-3" /> Visible
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                                                        <Lock className="w-3 h-3" /> Hidden
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setIsUserModalOpen(true);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                                                    >
                                                        View Profile
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
