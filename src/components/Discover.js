'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Clock, MapPin, Users, Calendar, ExternalLink,
    Sparkles, TrendingUp, Heart, Share2, Zap, BookOpen,
    Music, Palette, Code, Trophy, Globe, Lightbulb, X
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, where, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import toast from 'react-hot-toast';

// Campus Clubs Data
const CAMPUS_CLUBS = [
    { name: 'Robotics Club', icon: Zap, color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
    { name: 'Debate Club', icon: Users, color: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600' },
    { name: 'Music Club', icon: Music, color: 'bg-pink-500', gradient: 'from-pink-500 to-pink-600' },
    { name: 'Innovation Hub', icon: Lightbulb, color: 'bg-orange-500', gradient: 'from-orange-500 to-orange-600' },
    { name: 'Drama Club', icon: Palette, color: 'bg-green-500', gradient: 'from-green-500 to-green-600' },
    { name: 'Coding Club', icon: Code, color: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-600' },
    { name: 'Sports Club', icon: Trophy, color: 'bg-red-500', gradient: 'from-red-500 to-red-600' },
    { name: 'Literary Club', icon: BookOpen, color: 'bg-teal-500', gradient: 'from-teal-500 to-teal-600' },
];

// Mock Featured Events
const FEATURED_EVENTS = [
    {
        id: 1,
        title: 'Annual Tech Fest 2025',
        date: 'Oct 25-27',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
        tag: 'Festival',
        gradient: 'from-blue-600 to-purple-600'
    },
    {
        id: 2,
        title: 'Hackathon Night',
        date: 'Nov 5-6',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop',
        tag: 'Competition',
        gradient: 'from-green-600 to-teal-600'
    }
];

// Mock Upcoming Activities
const UPCOMING_ACTIVITIES = [
    {
        id: 1,
        title: 'AI/ML Workshop',
        type: 'Workshop',
        date: 'Tomorrow, 2 PM',
        location: 'CS Lab 301',
        attendees: 45,
        color: 'blue',
        category: 'Tech'
    },
    {
        id: 2,
        title: 'Photography Walk',
        type: 'Outdoor',
        date: 'Dec 4, 6 PM',
        location: 'Central Lawn',
        attendees: 28,
        color: 'orange',
        category: 'Arts'
    },
    {
        id: 3,
        title: 'Startup Pitch Competition',
        type: 'Competition',
        date: 'Dec 10, 10 AM',
        location: 'Auditorium',
        attendees: 120,
        color: 'green',
        category: 'Business'
    },
    {
        id: 4,
        title: 'React Bootcamp',
        type: 'Workshop',
        date: 'Dec 5, 3 PM',
        location: 'Online',
        attendees: 86,
        color: 'purple',
        category: 'Tech'
    },
    {
        id: 5,
        title: 'Cultural Night',
        type: 'Event',
        date: 'Dec 12, 7 PM',
        location: 'Main Stage',
        attendees: 250,
        color: 'pink',
        category: 'Cultural'
    },
    {
        id: 6,
        title: 'Open Mic',
        type: 'Performance',
        date: 'Dec 8, 6 PM',
        location: 'Cafeteria',
        attendees: 35,
        color: 'yellow',
        category: 'Arts'
    }
];

export default function Discover({ user }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const categories = ['All', 'Tech', 'Arts', 'Business', 'Cultural', 'Sports'];

    const [wishlist, setWishlist] = useState([]);
    const [registrations, setRegistrations] = useState([]);

    // Fetch events from Firestore
    useEffect(() => {
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
                // Fallback to mock data if fetch fails
                setEvents(UPCOMING_ACTIVITIES);
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Fetch User Wishlist and Registrations
    useEffect(() => {
        if (!user) return;

        // Wishlist Listener
        const wishlistRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wishlist', 'events');
        const unsubWishlist = onSnapshot(wishlistRef, (docSnap) => {
            if (docSnap.exists()) {
                setWishlist(docSnap.data().eventIds || []);
            } else {
                setWishlist([]);
            }
        });

        // Registrations Listener
        const registrationsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'registrations', 'events');
        const unsubRegistrations = onSnapshot(registrationsRef, (docSnap) => {
            if (docSnap.exists()) {
                setRegistrations(docSnap.data().eventIds || []);
            } else {
                setRegistrations([]);
            }
        });

        return () => {
            unsubWishlist();
            unsubRegistrations();
        };
    }, [user]);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || event.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const handleJoinEvent = async (eventId) => {
        if (!user) {
            toast.error('Please login to join events');
            return;
        }
        if (registrations.includes(eventId)) {
            toast.success('You are already registered!');
            return;
        }

        try {
            // 1. Add to user registrations
            const userRegRef = doc(db, 'artifacts', appId, 'users', user.uid, 'registrations', 'events');
            await setDoc(userRegRef, {
                eventIds: arrayUnion(eventId)
            }, { merge: true });

            // 2. Increment event attendees
            const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
            await updateDoc(eventRef, {
                attendees: increment(1)
            });

            // 3. Update local state (optional as listeners will catch it, but good for immediate feedback)
            toast.success('Successfully registered for event!');
        } catch (error) {
            console.error('Error joining event:', error);
            toast.error('Failed to join event');
        }
    };

    const handleLikeEvent = async (eventId) => {
        if (!user) {
            toast.error('Please login to wishlist events');
            return;
        }

        const isLiked = wishlist.includes(eventId);
        const wishlistRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wishlist', 'events');

        try {
            if (isLiked) {
                await setDoc(wishlistRef, {
                    eventIds: arrayRemove(eventId)
                }, { merge: true });
                toast.success('Removed from wishlist');
            } else {
                await setDoc(wishlistRef, {
                    eventIds: arrayUnion(eventId)
                }, { merge: true });
                toast.success('Added to wishlist');
            }
        } catch (error) {
            console.error('Error updating wishlist:', error);
            toast.error('Failed to update wishlist');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-24 px-4 md:px-6 pt-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900">Discover</h1>
                </div>
                <p className="text-gray-600 text-lg">Explore events, clubs, and opportunities</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search events, clubs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                />
            </div>

            {/* Featured Events */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Featured Events
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {FEATURED_EVENTS.map(event => (
                        <div key={event.id} className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-all">
                            <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t ${event.gradient} opacity-80`}></div>
                            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit border border-white/30">
                                    {event.tag}
                                </span>
                                <h3 className="text-2xl font-black mb-2">{event.title}</h3>
                                <div className="flex items-center gap-2 text-white/90">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{event.date}</span>
                                </div>
                                <button className="mt-4 bg-white text-gray-900 px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-100 transition w-fit">
                                    Register Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Campus Clubs */}
            <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    Campus Clubs
                </h2>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                    {CAMPUS_CLUBS.map((club, index) => (
                        <button
                            key={index}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${club.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                <club.icon className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-xs font-bold text-gray-700 text-center line-clamp-2">{club.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition ${activeCategory === category
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Upcoming Activities */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    Upcoming Activities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onJoin={handleJoinEvent}
                            onLike={handleLikeEvent}
                            isLiked={wishlist.includes(event.id)}
                            isJoined={registrations.includes(event.id)}
                            onViewDetails={(event) => {
                                setSelectedEvent(event);
                                setIsDetailModalOpen(true);
                            }}
                        />
                    ))}
                </div>
                {filteredEvents.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No events found matching your search</p>
                    </div>
                )}
            </div>

            {/* Event Detail Modal */}
            <EventDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedEvent(null);
                }}
                event={selectedEvent}
                onJoin={handleJoinEvent}
                isJoined={selectedEvent ? registrations.includes(selectedEvent.id) : false}
                onLike={handleLikeEvent}
                isLiked={selectedEvent ? wishlist.includes(selectedEvent.id) : false}
            />
        </div>
    );
}

// Event Detail Modal
const EventDetailModal = ({ isOpen, onClose, event, onJoin, isJoined, onLike, isLiked }) => {
    if (!isOpen || !event) return null;

    const colorClasses = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', button: 'bg-blue-600 hover:bg-blue-700' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', button: 'bg-orange-600 hover:bg-orange-700' },
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', button: 'bg-green-600 hover:bg-green-700' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', button: 'bg-purple-600 hover:bg-purple-700' },
        pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', button: 'bg-pink-600 hover:bg-pink-700' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', button: 'bg-yellow-600 hover:bg-yellow-700' },
    };

    const colors = colorClasses[event.color] || colorClasses.blue;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="relative h-64 md:h-80">
                    {event.image ? (
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${event.gradient || 'from-blue-500 to-purple-600'}`} />
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                        <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block border border-white/30">
                            {event.type}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{event.title}</h2>
                        <div className="flex items-center gap-4 text-white/90">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Calendar className="w-4 h-4" />
                                <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                                {event.category}
                            </span>
                            <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-2">
                                <Users className="w-4 h-4" /> {event.attendees} Attending
                            </span>
                        </div>
                        <button
                            onClick={() => onLike(event.id)}
                            className={`p-2 rounded-full transition ${isLiked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:text-red-500'}`}
                        >
                            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    <div className="prose prose-lg text-gray-600 mb-8">
                        <h3 className="text-gray-900 font-bold text-xl mb-2">About Event</h3>
                        <p>{event.description || "No description available for this event."}</p>
                    </div>

                    <button
                        onClick={() => onJoin(event.id)}
                        disabled={isJoined}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${isJoined
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : `${colors.button} text-white`
                            }`}
                    >
                        {isJoined ? 'Registered Successfully ✓' : 'Join Event Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Event Card Component
const EventCard = ({ event, onJoin, onLike, isLiked, isJoined, onViewDetails }) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', button: 'bg-blue-600 hover:bg-blue-700' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', button: 'bg-orange-600 hover:bg-orange-700' },
        green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', button: 'bg-green-600 hover:bg-green-700' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', button: 'bg-purple-600 hover:bg-purple-700' },
        pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', button: 'bg-pink-600 hover:bg-pink-700' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', button: 'bg-yellow-600 hover:bg-yellow-700' },
    };

    const colors = colorClasses[event.color] || colorClasses.blue;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all group overflow-hidden flex flex-col h-full">
            {/* Event Image */}
            <div className="relative h-48 w-full overflow-hidden cursor-pointer" onClick={() => onViewDetails(event)}>
                {event.image ? (
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${event.gradient || 'from-gray-100 to-gray-200'} group-hover:scale-110 transition-transform duration-500`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="absolute top-3 right-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onLike(event.id);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition ${isLiked ? 'bg-white text-red-500' : 'bg-black/20 text-white hover:bg-white hover:text-red-500'}`}
                    >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3">
                    <span className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-bold border ${colors.border}`}>
                        {event.type}
                    </span>
                </div>

                <h3
                    onClick={() => onViewDetails(event)}
                    className="font-bold text-gray-900 text-lg mb-3 group-hover:text-blue-600 transition line-clamp-2 cursor-pointer"
                >
                    {event.title}
                </h3>

                <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{event.attendees} attending</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onViewDetails(event)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm transition border border-gray-200 hover:bg-gray-50 text-gray-700"
                    >
                        View Details
                    </button>
                    <button
                        onClick={() => onJoin(event.id)}
                        disabled={isJoined}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition shadow-md ${isJoined
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : `${colors.button} text-white`
                            }`}
                    >
                        {isJoined ? 'Joined' : 'Join'}
                    </button>
                </div>
            </div>
        </div>
    );
};
