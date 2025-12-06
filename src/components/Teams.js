'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, X, Users, Mail, Github, Linkedin, ExternalLink, User, ToggleRight, CheckCircle2, XCircle, Camera, Briefcase, Calendar, MapPin, Clock, Send, UserPlus, Share2, Link as LinkIcon, Trash2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp, collectionGroup, getDocs, query, doc, setDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';
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
    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 flex flex-col h-full animate-pulse">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-200"></div>
            <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
        </div>
        <div className="flex gap-2 mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="flex gap-2">
                <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
                <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
            </div>
        </div>
    </div>
);

// Skeleton Grid
const SkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
);

// Skill Tag Component with colors
const SkillTag = ({ skill, index }) => {
    const colors = [
        'bg-blue-100 text-blue-700 border-blue-200',
        'bg-yellow-100 text-yellow-700 border-yellow-200',
        'bg-green-100 text-green-700 border-green-200',
        'bg-purple-100 text-purple-700 border-purple-200',
        'bg-pink-100 text-pink-700 border-pink-200',
        'bg-indigo-100 text-indigo-700 border-indigo-200',
    ];
    const colorClass = colors[index % colors.length];

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
            {skill.trim()}
        </span>
    );
};

// User Profile Card Component
const UserCard = ({ profile, userId, onInvite, currentUserEmail, onViewProfile, isAdmin, onDelete }) => {
    const skills = profile.skills ? profile.skills.split(',').filter(s => s.trim()) : [];
    const displaySkills = skills.slice(0, 3);
    const remainingSkills = skills.length - 3;
    const isAvailable = profile.status !== 'busy'; // Default to available if not set

    return (
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 flex flex-col h-full hover:shadow-xl transition-all hover:scale-[1.02] relative group">
            {isAdmin && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this user profile?')) {
                            onDelete(userId);
                        }
                    }}
                    className="absolute top-4 right-4 z-10 bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                    title="Delete User"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
            {/* Header with Avatar and Status */}
            <div className="flex items-start gap-4 mb-4">
                <div className="relative cursor-pointer group" onClick={() => onViewProfile(profile)}>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <img
                            src={profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || 'User'}`}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg truncate">{profile.name || 'Student'}</h3>
                        {profile.email && (profile.email.endsWith('@jec.ac.in') || profile.email.endsWith('@college.edu')) && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-gray-600 text-sm font-medium">{profile.branch || 'Branch'} • {profile.year || 'Year'}</p>
                    <div className="mt-1 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isAvailable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {isAvailable ? 'Open to Work' : 'Busy'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bio */}
            {profile.bio && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{profile.bio}</p>
            )}

            {/* Skills */}
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {displaySkills.map((skill, index) => (
                        <SkillTag key={index} skill={skill} index={index} />
                    ))}
                    {remainingSkills > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            +{remainingSkills}
                        </span>
                    )}
                </div>
            )}

            {/* Spotlight Projects */}
            {profile.projects && profile.projects.filter(p => p.title || p.description || p.link).length > 0 && (
                <div className="mb-4">
                    <p className="text-xs uppercase text-gray-400 font-bold mb-1">Spotlight</p>
                    <div className="space-y-2">
                        {profile.projects.filter(p => p.title || p.description || p.link).slice(0, 2).map((project, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-xs text-blue-700 font-semibold flex justify-between items-center">
                                <span className="truncate pr-2">{project.title || 'Untitled Project'}</span>
                                {project.link && (
                                    <button
                                        onClick={() => window.open(project.link, '_blank')}
                                        className="text-blue-600 font-bold text-[10px]"
                                    >
                                        View
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                    onClick={() => onInvite(profile)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition"
                >
                    <Mail className="w-4 h-4" /> Invite
                </button>
                <button
                    onClick={() => onViewProfile(profile)}
                    className="flex items-center justify-center gap-2 bg-gray-900/5 hover:bg-gray-900/10 text-gray-900 px-4 py-2.5 rounded-xl text-sm font-bold transition"
                >
                    <User className="w-4 h-4" /> View Profile
                </button>
                {(profile.github || profile.linkedin) && (
                    <button
                        onClick={() => {
                            if (profile.github) window.open(profile.github, '_blank');
                            else if (profile.linkedin) window.open(profile.linkedin, '_blank');
                        }}
                        className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold transition sm:col-span-2"
                    >
                        <ExternalLink className="w-4 h-4" /> Portfolio
                    </button>
                )}
            </div>
        </div>
    );
};

export default function Teams({ user, userData }) {
    const [profiles, setProfiles] = useState([]);
    const [teamPosts, setTeamPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamPostsLoading, setTeamPostsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isTeamPostDetailOpen, setIsTeamPostDetailOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [selectedTeamPost, setSelectedTeamPost] = useState(null);
    const [activeView, setActiveView] = useState('profiles'); // 'profiles' or 'teamPosts'
    const [isProfilePreviewOpen, setIsProfilePreviewOpen] = useState(false);

    const isAdmin = isAdminUser(user?.email) || isAdminUser(userData?.email);

    // Fetch all user profiles
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                // Use collectionGroup to query all profile/data documents
                const profileQuery = collectionGroup(db, 'profile');
                const snapshot = await getDocs(profileQuery);

                const fetchedProfiles = [];
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    // Only include if it's from our app and has required fields
                    if (data.name && docSnap.ref.path.includes(appId)) {
                        // Extract userId from path: artifacts/{appId}/users/{userId}/profile/data
                        const pathParts = docSnap.ref.path.split('/');
                        const userIdIndex = pathParts.indexOf('users');
                        const userId = userIdIndex !== -1 ? pathParts[userIdIndex + 1] : null;

                        if (userId && userId !== user?.uid) { // Exclude current user
                            // Check visibility preference (default to true if undefined for backward compatibility)
                            const isVisible = data.isVisibleInTeams !== false;

                            if (isVisible) {
                                fetchedProfiles.push({
                                    id: userId,
                                    ...data
                                });
                            }
                        }
                    }
                });

                setProfiles(fetchedProfiles);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching profiles:", error);
                toast.error("Failed to load profiles");
                setLoading(false);
            }
        };

        if (user) {
            fetchProfiles();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Fetch Team Posts in real-time
    useEffect(() => {
        const teamPostsRef = collection(db, 'artifacts', appId, 'public', 'data', 'team_posts');
        const unsubscribe = onSnapshot(teamPostsRef, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setTeamPosts(fetchedPosts);
            setTeamPostsLoading(false);
        }, (error) => {
            console.error("Error fetching team posts:", error);
            toast.error("Failed to load team posts");
            setTeamPostsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Filter profiles
    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = search === "" ||
            profile.name?.toLowerCase().includes(search.toLowerCase()) ||
            profile.skills?.toLowerCase().includes(search.toLowerCase()) ||
            profile.branch?.toLowerCase().includes(search.toLowerCase());

        const matchesAvailable = !showAvailableOnly || profile.status !== 'busy';

        return matchesSearch && matchesAvailable;
    });

    // Handle Invite
    const handleInvite = (profile) => {
        setSelectedProfile(profile);
        setIsInviteModalOpen(true);
    };

    const handleViewProfile = (profile) => {
        setSelectedProfile(profile);
        setIsProfilePreviewOpen(true);
    };

    const handleSendInvite = async (projectName) => {
        if (!user || !selectedProfile) return;

        try {
            // Save notification to the invited user's notifications collection
            const notificationRef = collection(db, 'artifacts', appId, 'users', selectedProfile.id, 'notifications');
            await addDoc(notificationRef, {
                type: 'team_invite',
                fromUserId: user.uid,
                fromUserName: userData?.name || 'Anonymous',
                fromUserEmail: userData?.email || user?.email || '',
                projectName,
                message: `${userData?.name || 'Someone'} wants to invite you to join their team for ${projectName}`,
                createdAt: serverTimestamp(),
                read: false
            });

            // Also send email via mailto
            const subject = encodeURIComponent(`Invitation to join team for ${projectName}`);
            const body = encodeURIComponent(`Hi ${selectedProfile.name},\n\nI would like to invite you to join my team for ${projectName}.\n\nLooking forward to working with you!\n\nBest regards,\n${userData?.name || 'Team Lead'}`);
            const email = selectedProfile.email || '';

            if (email) {
                window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
            }

            toast.success("Invitation sent successfully!");
            setIsInviteModalOpen(false);
            setSelectedProfile(null);
        } catch (error) {
            console.error("Error sending invite:", error);
            toast.error("Failed to send invitation");
        }
    };

    const handleDeleteTeamPost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this team post?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_posts', postId));
            toast.success("Team post deleted successfully");
        } catch (error) {
            console.error("Error deleting team post:", error);
            toast.error("Failed to delete team post");
        }
    };

    const handleDeleteUser = async (userId) => {
        // Note: Deleting a user from 'profile' collection group query results might require deleting the specific document.
        // Since we don't have the full path easily available in the profile object (unless we store it), 
        // we'll construct it assuming standard structure: artifacts/{appId}/users/{userId}/profile/data
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data'));
            toast.success("User profile deleted successfully");
            // Refresh profiles list manually or let real-time/useEffect handle it (though getDocs isn't real-time)
            setProfiles(prev => prev.filter(p => p.id !== userId));
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user profile");
        }
    };

    return (
        <div className="animate-in fade-in pb-24 pt-4 px-4 max-w-7xl mx-auto">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-3">Build Your Dream Team 🚀</h1>
                    <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl">
                        Find the perfect developer, designer, or pitcher for your next Hackathon.
                    </p>

                    {/* View Toggle */}
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={() => setActiveView('profiles')}
                            className={`px-6 py-2.5 rounded-xl font-bold transition ${activeView === 'profiles'
                                ? 'bg-white text-blue-600 shadow-lg'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            <Users className="w-4 h-4 inline mr-2" /> Find Members
                        </button>
                        <button
                            onClick={() => setActiveView('teamPosts')}
                            className={`px-6 py-2.5 rounded-xl font-bold transition ${activeView === 'teamPosts'
                                ? 'bg-white text-blue-600 shadow-lg'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            <Briefcase className="w-4 h-4 inline mr-2" /> Team Posts ({teamPosts.length})
                        </button>
                    </div>

                    {/* Search Bar - Only show for profiles view */}
                    {activeView === 'profiles' && (
                        <>
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by Skills (e.g., React, Figma) or Name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/95 backdrop-blur-md border-0 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-500 shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-lg"
                                />
                            </div>

                            {/* Toggle Switch */}
                            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 w-fit">
                                <ToggleRight
                                    className={`w-6 h-6 cursor-pointer transition ${showAvailableOnly ? 'text-green-300' : 'text-gray-300'}`}
                                    onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                                />
                                <span className="text-white font-bold text-sm">Show only Available Students</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Profiles Grid */}
            {activeView === 'profiles' && (
                <>
                    {loading ? (
                        <SkeletonGrid />
                    ) : filteredProfiles.length === 0 ? (
                        <div className="text-center py-20">
                            <Users className="w-24 h-24 mx-auto mb-6 text-gray-300 opacity-50" />
                            <h3 className="text-2xl font-bold text-gray-700 mb-2">No profiles found</h3>
                            <p className="text-gray-500">
                                {search ? "Try adjusting your search or filters" : "Be the first to create a profile!"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProfiles.map((profile) => (
                                <UserCard
                                    key={profile.id}
                                    profile={profile}
                                    userId={profile.id}
                                    onInvite={handleInvite}
                                    currentUserEmail={userData?.email}
                                    onViewProfile={handleViewProfile}
                                    isAdmin={isAdmin}
                                    onDelete={handleDeleteUser}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Team Posts Grid */}
            {activeView === 'teamPosts' && (
                <>
                    {teamPostsLoading ? (
                        <SkeletonGrid />
                    ) : teamPosts.length === 0 ? (
                        <div className="text-center py-20">
                            <Briefcase className="w-24 h-24 mx-auto mb-6 text-gray-300 opacity-50" />
                            <h3 className="text-2xl font-bold text-gray-700 mb-2">No team posts yet</h3>
                            <p className="text-gray-500 mb-4">Be the first to create a team post!</p>
                            <button
                                onClick={() => setIsCreateTeamModalOpen(true)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition"
                            >
                                Create Team Post
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teamPosts.map((post) => (
                                <TeamPostCard
                                    key={post.id}
                                    post={post}
                                    user={user}
                                    isAdmin={isAdmin}
                                    onDelete={() => handleDeleteTeamPost(post.id)}
                                    onClick={() => {
                                        setSelectedTeamPost(post);
                                        setIsTeamPostDetailOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Create Team FAB */}
            <button
                onClick={() => setIsCreateTeamModalOpen(true)}
                className="fixed bottom-24 right-6 md:bottom-10 md:right-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-xl shadow-blue-600/30 hover:scale-110 transition active:scale-95 z-30 flex items-center gap-2 pr-6"
            >
                <Plus className="w-6 h-6" /> <span className="hidden md:block font-bold">Create Team Post</span>
            </button>

            {/* Create Team Modal */}
            <CreateTeamModal
                isOpen={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
                user={user}
                userData={userData}
                onSuccess={() => setActiveView('teamPosts')}
            />

            {/* Profile Preview Modal */}
            <ProfilePreviewModal
                isOpen={isProfilePreviewOpen}
                profile={selectedProfile}
                onClose={() => {
                    setIsProfilePreviewOpen(false);
                    setSelectedProfile(null);
                }}
                onInvite={() => {
                    if (selectedProfile) {
                        setIsProfilePreviewOpen(false);
                        handleInvite(selectedProfile);
                    }
                }}
            />

            {/* Invite Modal */}
            <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => {
                    setIsInviteModalOpen(false);
                    setSelectedProfile(null);
                }}
                profile={selectedProfile}
                onSend={handleSendInvite}
            />

            {/* Team Post Detail Modal */}
            <TeamPostDetailModal
                isOpen={isTeamPostDetailOpen}
                onClose={() => {
                    setIsTeamPostDetailOpen(false);
                    setSelectedTeamPost(null);
                }}
                post={selectedTeamPost}
                user={user}
                userData={userData}
            />
        </div>
    );
}

// Team Post Card Component
const TeamPostCard = ({ post, user, onClick, isAdmin, onDelete }) => {
    if (!post) return null;

    return (
        <div
            onClick={onClick}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 flex flex-col h-full hover:shadow-xl transition-all cursor-pointer relative group"
        >
            {(isAdmin || user?.uid === post.createdBy) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-4 right-4 z-10 bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                    title="Delete Post"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
            {post.image && (
                <div className="h-48 rounded-xl overflow-hidden mb-4 bg-gray-100">
                    <img src={post.image} alt={post.teamName} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-xl mb-2">{post.teamName}</h3>
                <p className="text-blue-600 font-semibold text-sm mb-3">{post.projectName}</p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.description}</p>
                {post.rolesNeeded && post.rolesNeeded.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Roles Needed:</p>
                        <div className="flex flex-wrap gap-2">
                            {post.rolesNeeded.map((role, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                                    {role}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.createdByName}`}
                                alt={post.createdByName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{post.createdByName}</span>
                    </div>
                    {post.createdBy === user?.uid && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Your Post</span>
                    )}
                </div>
            </div>
        </div>
    );
};

// Create Team Modal Component
const CreateTeamModal = ({ isOpen, onClose, user, userData, onSuccess }) => {
    const [formData, setFormData] = useState({
        teamName: '',
        projectName: '',
        description: '',
        roles: [''],
        image: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({ teamName: '', projectName: '', description: '', roles: [''], image: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAddRole = () => {
        setFormData({ ...formData, roles: [...formData.roles, ''] });
    };

    const handleRemoveRole = (index) => {
        const newRoles = formData.roles.filter((_, i) => i !== index);
        setFormData({ ...formData, roles: newRoles });
    };

    const handleRoleChange = (index, value) => {
        const newRoles = [...formData.roles];
        newRoles[index] = value;
        setFormData({ ...formData, roles: newRoles });
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) {
                toast.error("Image too large! Max 500KB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setFormData({ ...formData, image: reader.result });
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'team_posts'), {
                teamName: formData.teamName,
                projectName: formData.projectName,
                description: formData.description,
                rolesNeeded: formData.roles.filter(r => r.trim()),
                image: formData.image || '',
                createdBy: user.uid,
                createdByName: userData?.name || 'Anonymous',
                createdAt: serverTimestamp()
            });
            toast.success("Team post created successfully!");
            onClose();
            setFormData({ teamName: '', projectName: '', description: '', roles: [''], image: '' });
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create team post");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Create Team Post</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team Image (Optional)</label>
                        <div
                            onClick={() => fileInputRef.current.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition cursor-pointer relative overflow-hidden"
                        >
                            {formData.image ? (
                                <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <>
                                    <Camera className="w-8 h-8 mb-2" />
                                    <span className="text-xs font-bold">Add Team Image</span>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImage} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team Name</label>
                        <input
                            required
                            value={formData.teamName}
                            onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                            placeholder="e.g., Code Warriors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hackathon/Project Name</label>
                        <input
                            required
                            value={formData.projectName}
                            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                            placeholder="e.g., Statewide Hackathon 2025"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="4"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none"
                            placeholder="Describe your project and what you're looking for..."
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase">Roles Needed</label>
                            <button
                                type="button"
                                onClick={handleAddRole}
                                className="text-blue-600 text-xs font-bold hover:text-blue-700"
                            >
                                + Add Role
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.roles.map((role, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        value={role}
                                        onChange={(e) => handleRoleChange(index, e.target.value)}
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                                        placeholder="e.g., Need 1 UI Designer"
                                    />
                                    {formData.roles.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRole(index)}
                                            className="px-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition flex justify-center"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Team Post"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Invite Modal Component
const ProfilePreviewModal = ({ isOpen, profile, onClose, onInvite }) => {
    if (!isOpen || !profile) return null;
    const projects = (profile.projects || []).filter(project => project.title || project.description || project.link);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Profile Preview</p>
                        <h3 className="text-2xl font-black text-gray-900">{profile.name || 'Student'}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="grid md:grid-cols-2 gap-6 p-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-blue-50 shadow-lg">
                                <img
                                    src={profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || 'User'}`}
                                    alt={profile.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500">{profile.branch || 'Branch'} • {profile.year || 'Year'}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                        {profile.status === 'busy' ? 'Currently Busy' : 'Open to Work'}
                                    </span>
                                    {profile.email && (profile.email.endsWith('@jec.ac.in') || profile.email.endsWith('@college.edu')) && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">Verified Student</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {profile.bio && (
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">About</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}
                        {profile.skills && (
                            <div>
                                <p className="text-xs uppercase font-bold text-gray-400 mb-2">Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.split(',').map((skill, index) => (
                                        <span key={index} className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                            {profile.github && (
                                <button
                                    onClick={() => window.open(profile.github, '_blank')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-800 font-bold text-sm"
                                >
                                    <Github className="w-4 h-4" /> GitHub
                                </button>
                            )}
                            {profile.linkedin && (
                                <button
                                    onClick={() => window.open(profile.linkedin, '_blank')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm"
                                >
                                    <Linkedin className="w-4 h-4" /> LinkedIn
                                </button>
                            )}
                            {profile.email && (
                                <button
                                    onClick={() => window.location.href = `mailto:${profile.email}`}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-sm"
                                >
                                    <Mail className="w-4 h-4" /> Email
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs uppercase font-bold text-gray-400">Showcase</p>
                            <button
                                onClick={onInvite}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm shadow-lg"
                            >
                                <Send className="w-4 h-4" /> Invite to Team
                            </button>
                        </div>
                        <div className="space-y-4">
                            {projects.length > 0 ? (
                                projects.map((project, index) => (
                                    <div key={index} className="border border-gray-200 rounded-2xl p-4 bg-white/80">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Project #{index + 1}</p>
                                        <h4 className="text-lg font-bold text-gray-900 mt-1">{project.title || 'Untitled Project'}</h4>
                                        {project.description && (
                                            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                                        )}
                                        {project.link && (
                                            <button
                                                onClick={() => window.open(project.link, '_blank')}
                                                className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600"
                                            >
                                                <LinkIcon className="w-4 h-4" /> Open Project
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm">
                                    No showcased projects yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InviteModal = ({ isOpen, onClose, profile, onSend }) => {
    const [projectName, setProjectName] = useState('');

    if (!isOpen || !profile) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!projectName.trim()) {
            toast.error("Please enter a project name");
            return;
        }
        onSend(projectName);
        setProjectName('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Invite {profile.name}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project/Hackathon Name</label>
                        <input
                            required
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                            placeholder="e.g., Statewide Hackathon 2025"
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        An invitation will be sent via email and saved to their notifications.
                    </p>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition"
                    >
                        Send Invitation
                    </button>
                </form>
            </div>
        </div>
    );
};

// Team Post Detail Modal - Professional View
const TeamPostDetailModal = ({ isOpen, onClose, post, user, userData }) => {
    const [creatorProfile, setCreatorProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [applying, setApplying] = useState(false);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCreatorProfile(null);
            setLoadingProfile(false);
            setApplying(false);
        }
    }, [isOpen]);

    // Fetch creator profile when modal opens
    useEffect(() => {
        const fetchCreatorProfile = async () => {
            if (!isOpen || !post?.createdBy) return;

            setLoadingProfile(true);
            setCreatorProfile(null);
            try {
                const profileRef = doc(db, 'artifacts', appId, 'users', post.createdBy, 'profile', 'data');
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                    setCreatorProfile(profileSnap.data());
                }
            } catch (error) {
                console.error("Error fetching creator profile:", error);
                toast.error("Failed to load creator profile");
            } finally {
                setLoadingProfile(false);
            }
        };

        if (isOpen && post?.createdBy) {
            fetchCreatorProfile();
        }
    }, [isOpen, post?.createdBy]);

    const handleJoinTeam = async () => {
        if (!user || !post) return;

        if (post.createdBy === user.uid) {
            toast.error("You cannot join your own team!");
            return;
        }

        setApplying(true);
        try {
            // Send notification to team creator
            const notificationRef = collection(db, 'artifacts', appId, 'users', post.createdBy, 'notifications');
            await addDoc(notificationRef, {
                type: 'team_join_request',
                fromUserId: user.uid,
                fromUserName: userData?.name || 'Anonymous',
                fromUserEmail: userData?.email || user?.email || '',
                teamPostId: post.id,
                teamName: post.teamName,
                projectName: post.projectName,
                message: `${userData?.name || 'Someone'} wants to join your team "${post.teamName}" for ${post.projectName}`,
                createdAt: serverTimestamp(),
                read: false
            });

            // Send email
            if (creatorProfile?.email) {
                const subject = encodeURIComponent(`Join Request for ${post.teamName}`);
                const body = encodeURIComponent(`Hi ${post.createdByName},\n\nI'm interested in joining your team "${post.teamName}" for ${post.projectName}.\n\n${userData?.bio ? `About me: ${userData.bio}\n\n` : ''}Skills: ${userData?.skills || 'Not specified'}\n\nLooking forward to hearing from you!\n\nBest regards,\n${userData?.name || 'Student'}`);
                window.location.href = `mailto:${creatorProfile.email}?subject=${subject}&body=${body}`;
            }

            toast.success("Join request sent! The team leader will contact you soon.");
        } catch (error) {
            console.error("Error sending join request:", error);
            toast.error("Failed to send join request");
        } finally {
            setApplying(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: post?.teamName,
            text: `Check out this team: ${post?.teamName} - ${post?.projectName}`,
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
                // Clipboard failed, use fallback method
                console.error("Clipboard write failed:", error);
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

    if (!isOpen || !post) return null;

    const formatDate = (timestamp) => {
        if (!timestamp?.seconds) return 'Recently';
        try {
            const date = new Date(timestamp.seconds * 1000);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (error) {
            return 'Recently';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl my-8">
                {/* Header with Image */}
                <div className="relative">
                    {post.image ? (
                        <div className="h-64 md:h-80 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
                            <img src={post.image} alt={post.teamName} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-64 md:h-80 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 flex items-center justify-center">
                            <Briefcase className="w-24 h-24 text-white/30" />
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full hover:bg-white transition shadow-lg"
                    >
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                        onClick={handleShare}
                        className="absolute top-4 right-16 bg-white/90 backdrop-blur-md p-2 rounded-full hover:bg-white transition shadow-lg"
                    >
                        <Share2 className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-20rem)]">
                    {/* Title Section */}
                    <div className="mb-6">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{post.teamName}</h1>
                                <div className="flex items-center gap-3 text-blue-600 font-bold text-lg">
                                    <Briefcase className="w-5 h-5" />
                                    <span>{post.projectName}</span>
                                </div>
                            </div>
                            {post.createdBy === user?.uid && (
                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
                                    Your Team
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Posted {formatDate(post.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">About the Project</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.description}</p>
                    </div>

                    {/* Roles Needed */}
                    {post.rolesNeeded && post.rolesNeeded.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Roles We're Looking For</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {post.rolesNeeded.map((role, index) => (
                                    <div key={index} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                            <span className="font-bold text-blue-900">{role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team Leader Section */}
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Team Leader</h2>
                        {loadingProfile ? (
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
                                <div className="flex-1">
                                    <div className="h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                                    <img
                                        src={creatorProfile?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.createdByName}`}
                                        alt={post.createdByName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900 text-lg">{post.createdByName}</h3>
                                        {creatorProfile?.email && (creatorProfile.email.endsWith('@jec.ac.in') || creatorProfile.email.endsWith('@college.edu')) && (
                                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm">
                                        {creatorProfile?.branch || 'Branch'} • {creatorProfile?.year || 'Year'}
                                    </p>
                                    {creatorProfile?.skills && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {creatorProfile.skills.split(',').slice(0, 3).map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-white text-gray-700 rounded-full text-xs font-bold border border-gray-200">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {creatorProfile?.github && (
                                        <a
                                            href={creatorProfile.github}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <Github className="w-5 h-5 text-gray-700" />
                                        </a>
                                    )}
                                    {creatorProfile?.linkedin && (
                                        <a
                                            href={creatorProfile.linkedin}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <Linkedin className="w-5 h-5 text-blue-600" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {post.createdBy !== user?.uid ? (
                            <>
                                <button
                                    onClick={handleJoinTeam}
                                    disabled={applying}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-lg"
                                >
                                    {applying ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending Request...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5" />
                                            Join This Team
                                        </>
                                    )}
                                </button>
                                {creatorProfile?.email && (
                                    <button
                                        onClick={() => {
                                            const subject = encodeURIComponent(`Inquiry about ${post.teamName}`);
                                            const body = encodeURIComponent(`Hi ${post.createdByName},\n\nI'm interested in learning more about your team "${post.teamName}" for ${post.projectName}.\n\nBest regards,\n${userData?.name || 'Student'}`);
                                            window.location.href = `mailto:${creatorProfile.email}?subject=${subject}&body=${body}`;
                                        }}
                                        className="flex-1 bg-white border-2 border-blue-600 text-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-2 text-lg"
                                    >
                                        <Mail className="w-5 h-5" />
                                        Contact Leader
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                                <p className="text-blue-900 font-bold">This is your team post. Share it to find members!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

