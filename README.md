# 🏆 ICPC Regional Hub - Codeforces Gym Practice & Tracker (2023 - 2026+)

Codeforces Gym থেকে সব ICPC Regional Contest গুলো স্বয়ংক্রিয়ভাবে সংগ্রহ করে সুন্দরভাবে সাজানো, প্র্যাকটিস ট্র্যাকিং, মার্কিং (Solved, Upsolving, To Do, Starred), এবং নোটস সংরক্ষণের জন্য একটি পূর্ণাঙ্গ আধুনিক ওয়েব অ্যাপ্লিকেশন।

---

## 🚀 ফিচারসমূহ (Key Features)

1. **ইয়ার ভিত্তিক ফিল্টারিং (Focus on 2023–2026+)**:
   - **2026**, **2025**, **2024**, **2023** এর প্রতিটি আঞ্চলিক ও সাব-আঞ্চলিক কনটেস্ট আলাদা ট্যাব ও কাউন্ট সহ সাজানো।
   - টার্গেট ইয়ার প্রোগ্রেস বার (কত শতাংশ সলভড/আপসলভড হয়েছে)।
   - আর্কাইভ (2022 ও পূর্ববর্তী কনটেস্টসমূহ) দেখার সুবিধা।

2. **অঞ্চল (Region) ভিত্তিক ফিল্টারিং**:
   - 🇧🇩 **Asia Dhaka / Bangladesh Regional**
   - 🌏 **Asia Regional** (Asia Pacific, West, Taichung, Seoul, Yokohama, Hanoi, Jakarta, etc.)
   - 🇪🇺 **Europe Regional** (NWERC, SWERC, CERC, SEERC, EUC, NERC)
   - 🇺🇸 **North America Regional** (NAC, Greater NY, Mid-Atlantic, etc.)
   - 🌎 **Latin America & Brazil**
   - 🌍 **Africa & Arab (ACPC)**
   - 🌐 **Global / Subregionals**

3. **কোডফোর্সেস জিম লিঙ্কআপ ও অ্যাকশন (Linkup & Actions)**:
   - **Open in Gym (↗)**: এক ক্লিকে সরাসরি কোডফোর্সেস জিম পেজ ওপেন হয় (`https://codeforces.com/gym/{contestId}`).
   - **Standings (↗)**: সরাসরি জিম স্ট্যান্ডিংস দেখা যায়।
   - **Gym ID কপি বাটন**: ক্লিক করলেই ক্লিপবোর্ডে আইডি কপি হয়।

4. **স্মার্ট মার্কিং এবং প্রোগ্রেস সেভ (Marking & Local Persistence)**:
   - **স্ট্যাটাস ড্রপডাউন**: `⚪ Not Started`, `📌 To Do`, `⏳ In Progress / Upsolving`, `✅ Solved / Completed`.
   - **স্টার বাটন (★)**: প্রিয় বা টিম প্র্যাকটিসের জন্য প্রায়োরিটি কনটেস্ট বুকমার্ক করা যায়।
   - **ইন্টারেক্টিভ প্র্যাকটিস মোডাল (Practice & Notes)**:
     - প্রবলেম চেকলিস্ট (A থেকে M): ক্লিক করে `🟢 Solved in Contest` &rarr; `🟡 Upsolved` &rarr; `⚪ Reset` করা যায়।
     - **৫ ঘণ্টার ভার্চুয়াল কনটেস্ট স্টপওয়াচ**: আসল ICPC কনটেস্টের মতো ৫ ঘণ্টার টাইমার চালিয়ে প্র্যাকটিস করা যায়।
     - **টিম প্র্যাকটিস নোটস**: প্রবলেম আইডিয়া, এডিটোরিয়াল লিঙ্ক এবং টিমমেটদের নোট লিখে সেভ রাখা যায়।
   - **অটো-সেভ**: সমস্ত ডেটা ব্রাউজারের `localStorage`-এ সুরক্ষিত থাকে (পেজ রিফ্রেশ বা ব্রাউজার বন্ধ করলেও তথ্য হারাবে না)।

5. **SQLite ডাটাবেস ও ব্যাকএন্ড (SQLite Database & REST API)**:
   - **পার্মানেন্ট ডাটাবেস (`database/icpc.db`)**: ব্রাউজার ক্যাশ ক্লিয়ার করলেও কোনো প্র্যাকটিস ডেটা হারাবে না।
   - **অটো-সিড (Auto-Seed)**: সার্ভার চালুর সাথে সাথেই কোডফোর্সেস জিমের ৪৯৫টি ICPC কনটেস্ট স্বয়ংক্রিয়ভাবে SQLite ডাটাবেসে সেভ হয়ে যায়।
   - **লাইভ সিঙ্ক**: যেকোনো কনটেস্ট মার্ক করা, প্রবলেম A–M এর স্ট্যাটাস এবং টিম নোটস ডাটাবেসে রিয়েল-টাইমে আপডেট হয়।
   - **অফলাইন ফলব্যাক**: ব্যাকএন্ড সার্ভার বন্ধ থাকলেও ফ্রন্টএন্ড লোকাল ক্যাশ দিয়ে নির্বিঘ্নে চলবে এবং সার্ভার অন হলে আবার ডাটাবেসের সাথে সিঙ্ক হবে।

6. **গুগল লগইন এবং ইউজার ট্র্যাকিং (Google Sign-In & User Tracking)**:
   - **Sign in with Google**: গুগলের অফিসিয়াল Google Identity Services (GIS) এবং দ্রুত লগইন সাপোর্ট।
   - **পার্সোনাল সলভিং প্রোফাইল**: গুগল অ্যাকাউন্টে লগইন করলে আপনার সলভিং হিস্ট্রি, আপসলভিং চেকলিস্ট এবং নোটস স্বয়ংক্রিয়ভাবে ওই নির্দিষ্ট গুগল ইউজারের সাথে SQLite ডাটাবেসে সংরক্ষিত থাকবে।
   - **ইউজার প্রোফাইল মেনু**: নেভবারে ইউজারের গুগল অ্যাভাটার, নাম, ইমেইল এবং মোট সলভ/আপসলভ করা কনটেস্টের লাইভ পরিসংখ্যান দেখা যায়।

7. **লাইভ কোডফোর্সেস সিঙ্ক (Sync Codeforces)**:
   - কোডফোর্সেস জিম এপিআই (`https://codeforces.com/api/contest.list?gym=true`) থেকে নতুন কোনো কনটেস্ট এলে এক ক্লিকেই সিঙ্ক করে ডাটাবেসে যুক্ত করা যায়।

8. **অনলাইন ক্লাউড ডাটাবেস (Google Cloud Firestore / Cloud REST)**:
   - **রিয়েলটাইম ক্লাউড সিঙ্ক**: যেকোনো ডিভাইস বা টিমমেটের সাথে আপনার প্রোগ্রেস ও নোটস রিয়েলটাইমে সিঙ্ক রাখুন।
   - **স্বয়ংক্রিয় ক্লাউড ব্যাকআপ**: আপনি যখনই কোনো কনটেস্ট সলভড বা প্রবলেম মার্ক করবেন, তা সাথে সাথে অনলাইন ডাটাবেসে সেভ হয়ে যাবে।
   - **টিম শেয়ারিং**: আপনার টিমমেটরা তাদের মোবাইল বা ল্যাপটপ থেকে "Pull from Cloud" বাটনে চাপলে সরাসরি আপনার করা মার্কিং দেখতে পারবে।

9. **ব্যাকআপ ও রিস্টোর (Export / Import)**:
   - **Export**: আপনার সম্পূর্ণ মার্কিং ও নোটস JSON ফাইলে ডাউনলোড করে সেভ রাখতে পারবেন।
   - **Import**: অন্য পিসিতে বা টিমমেটদের সাথে ফাইল শেয়ার করে প্রোগ্রেস রিস্টোর করা যায়।
   - **Copy Summary**: টিম ডিসকর্ড/নোটেশনের জন্য সরাসরি মার্কডাউন সামারি কপি করা যায়।

10. **ভিউ মোড (Grid Cards vs Compact Table)**:
    - গ্রিড কার্ড ভিউ এবং দ্রুত স্ক্যানিংয়ের জন্য কম্প্যাক্ট টেবিল ভিউ।

---

## 💻 কীভাবে চালাবেন (How to Run)

### পদ্ধতি ১: ব্যাকএন্ড ডাটাবেস সার্ভার চালিয়ে (Recommended)
ফোল্ডারে থাকা [`start_server.bat`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/start_server.bat) ফাইলে ডাবল ক্লিক করুন, অথবা টার্মিনালে চালান:
```bash
python server.py
```
তারপর ব্রাউজারে প্রবেশ করুন: **`http://localhost:3300`**

### পদ্ধতি ২: যেকোনো ব্রাউজারে সরাসরি অফলাইন মোডে ওপেন করুন
- সরাসরি [`index.html`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/index.html) ফাইলটিতে ডাবল ক্লিক করে ওপেন করতে পারেন (এটি স্বয়ংক্রিয়ভাবে লোকাল ক্যাশ মোডে চলবে)।

---

## 🚀 GitHub Pages-এ লাইভ হোস্ট করার নিয়ম (Live Hosting)

১. [GitHub.com](https://github.com)-এ গিয়ে একটি নতুন Repository তৈরি করুন (যেমন: `icpc-tracker`)।
২. আপনার ফোল্ডারে থাকা [`push_to_github.bat`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/push_to_github.bat) ফাইলে ডাবল ক্লিক করুন এবং আপনার GitHub Repo URL পেস্ট করুন।
   *(অথবা টার্মিনালে চালান:)*
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
   git branch -M main
   git push -u origin main
   ```
৩. গিটহাব রিপোজিটরির **Settings** -> **Pages** অপশনে যান:
   - **Source**: ড্রপডাউন থেকে **`GitHub Actions`** সিলেক্ট করুন।
৪. ১-২ মিনিটের মধ্যে আপনার ওয়েবসাইট লাইভ হয়ে যাবে: **`https://<YOUR_USERNAME>.github.io/<REPO_NAME>/`**

---

## 📁 ফাইল স্ট্রাকচার

- [`server.py`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/server.py) - Flask ব্যাকএন্ড ও SQLite REST API ইঞ্জিন
- [`database/icpc.db`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/database/icpc.db) - পার্মানেন্ট SQLite ডাটাবেস ফাইল
- [`cloud-db.js`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/cloud-db.js) - Google Cloud Firestore ও অনলাইন ক্লাউড সিঙ্ক মডিউল
- [`index.html`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/index.html) - প্রধান ইউজার ইন্টারফেস ও স্ট্রাকচার
- [`styles.css`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/styles.css) - প্রিমিয়াম ডার্ক থিম, গ্লাস মরফিজম ও রেসপনসিভ সিএসএস
- [`app.js`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/app.js) - ফিল্টারিং, সার্চ, মার্কিং, টাইমার, গুগল অথ ও ডাটাবেস সিঙ্ক ইঞ্জিন
- [`data/contests.json`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/data/contests.json) - কোডফোর্সেস জিমের সমস্ত ICPC কনটেস্টের প্রাথমিক ডেটাসেট
- [`start_server.bat`](file:///c:/Users/m0stafakamal/Desktop/ICPC%20Preparation/ICPC%20Regional/start_server.bat) - এক ক্লিকে সার্ভার ও ব্রাউজার চালু করার উইন্ডোজ স্ক্রিপ্ট
