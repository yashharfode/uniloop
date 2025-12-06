# 🌀 UniLoop — Your Entire Campus Life. In One Loop.

> This project is built for **Technocrates Hackathon** as a full-stack **Campus Super-App** for students.  
> UniLoop connects **resources, notes, hackathons, teams, scholarships & lost–found** into ONE platform.

🔗 **Live Demo:** https://uniloop-six.vercel.app  

---

## 🎯 Problem

College life aaj bhi kaafi scattered hai:

- Notes & PYQs WhatsApp groups me kho jaate hain  
- Books, drafters, lab coats, calculators useless pade rehte hain instead of helping juniors  
- Hackathons ka pata late chalta hai, aur team banana aur bhi difficult  
- Scholarships, events, deadlines – sab alag alag jagah  
- Lost & Found ka koi proper system nahi  
- Juniors ko seniors ki help chahiye, but discover karna mushkil  

**UniLoop** in sab ko **ek hi app** me laata hai.

---

## ✅ Our Solution — UniLoop

UniLoop is a **campus super-app** where students can:

- 📦 **Share / Sell / Rent / Donate** physical resources (books, drafters, calculators, etc.)  
- 📚 Access & upload **Notes, PYQs, Assignments** – subject + semester wise  
- 🏆 Discover **Hackathons** & important details at one place  
- 🤝 Use a **Team Builder** to find teammates by skills (React, ML, Backend, UI/UX…)  
- 🎓 Explore **Scholarships** with eligibility, documents & deadlines  
- 🧳 Report & claim items via **Lost & Found** hub  
- 💬 Chat securely with other verified students (planned / in progress)  
- 🗓️ (Planned) **Timetable + Class reminders** & **Notes feed**  

Goal: **Make campus life structured, discoverable and collaborative.**

---

## 🌟 Key Features

### 1️⃣ Resource Sharing Hub
- Add items: **Sell / Rent / Donate / Exchange**
- Attach multiple images  
- Filter by **branch, semester, category & mode**
- View item details + owner info

### 2️⃣ Notes Hub
- Upload notes / PYQs / assignments (PDF)  
- Filter by **Semester + Subject**  
- Central library so juniors don’t have to beg for notes every exam 😅

### 3️⃣ Hackathon Finder
- List of relevant hackathons for students  
- Show: **Title, Organizer, Prize, Deadline, Mode (Online/Offline)**  
- Detail view page for more info

### 4️⃣ Team Builder (USP Feature)
- Browse students by **skills**  
- Show GitHub / LinkedIn / (optional Resume)  
- Filter by tags like **React, ML, Backend, UI/UX, DSA**  
- Helps form **balanced teams** for hackathons & projects

### 5️⃣ Scholarships Hub
- Curated list of scholarships for students  
- Each card shows:
  - Amount / reward  
  - Eligibility  
  - Deadline  
  - Required documents  
  - Official apply link  

### 6️⃣ Lost & Found
- Tabs: **Lost** | **Found**  
- Add item with **image, description, location, date**  
- Helps connect item owners quickly

---

## 🧱 Architecture (High-Level)

```text
UniLoop (this repo) - Next.js frontend (App + Landing + UI)

[Planned / Separate backend]
- Node.js + Express APIs
- Firebase for data (users, resources, notes, hackathons, scholarships, lostFound)
- Socket.io for chat (future)
- Firestore Database for image uploads
