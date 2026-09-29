-- ==============================================================================
-- CAMPUS NEXUS - OPTIONAL SAMPLE SEED DATA SCRIPT
-- ==============================================================================
-- WARNING: Only run this script if you deliberately wish to populate a test or
-- demo database with sample events and registrations. DO NOT run this in a live
-- production database where you wish to preserve clean real-world state.
--
-- This script is idempotent: it checks for existing events before inserting.
-- ==============================================================================

-- 1. Insert Sample Events (if table is empty)
INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'Nexus Hackathon 2026: Code the Future',
    'Our premier 36-hour flagship hackathon bringing together over 300 passionate student developers, designers, and innovators. Tackle real-world problems in AI, Web3, FinTech, and Sustainable Tech. Enjoy round-the-clock mentorship, free meals, high-speed Wi-Fi, and compete for a prize pool exceeding $5,000 plus internship opportunities!',
    'Hackathon',
    CURRENT_DATE + INTERVAL '14 days',
    '09:00 AM',
    '09:00 PM (Next Day)',
    'Campus Innovation Hub & Main Auditorium',
    true,
    true,
    350,
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Nexus Hackathon 2026: Code the Future');

INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'Full-Stack Mastery: Spring Boot 3 & Modern React',
    'An intensive hands-on architectural workshop designed for aspiring software engineers. Learn how to architect enterprise-grade REST APIs with Spring Security and PostgreSQL, and build sleek, reactive frontends with React, Vite, and TypeScript. Laptop required.',
    'Workshop',
    CURRENT_DATE + INTERVAL '7 days',
    '10:00 AM',
    '04:30 PM',
    'Computer Science Lab 3, Block B',
    false,
    true,
    80,
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Full-Stack Mastery: Spring Boot 3 & Modern React');

INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'Cloud & DevOps: Docker, Kubernetes & AWS Essentials',
    'Learn modern cloud infrastructure from industry DevOps practitioners. Cover Docker containerization, container orchestration basics with Kubernetes, and production deployment automation using AWS Elastic Beanstalk and GitHub Actions.',
    'Technical',
    CURRENT_DATE + INTERVAL '21 days',
    '02:00 PM',
    '06:00 PM',
    'Seminar Hall 2, Science Complex',
    false,
    true,
    120,
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Cloud & DevOps: Docker, Kubernetes & AWS Essentials');

INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'Aura 2026: Annual Inter-College Cultural Extravaganza',
    'The most vibrant night of the semester! Experience electrifying music band battles, contemporary dance showdowns, theatrical drama performances, and gourmet street food stalls organized by college student chapters across the region.',
    'Cultural',
    CURRENT_DATE + INTERVAL '28 days',
    '05:00 PM',
    '10:30 PM',
    'University Open Air Amphitheatre',
    false,
    true,
    1000,
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Aura 2026: Annual Inter-College Cultural Extravaganza');

INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'Campus Smash: Inter-Department Cricket Tournament',
    'Get ready for the highest-stakes cricket tournament of the year! 16 departmental teams battle it out across 4 days in a high-voltage T10 format. Cheer for your branch, witness thrilling super-overs, and take home the coveted Chancellor Trophy.',
    'Sports',
    CURRENT_DATE + INTERVAL '10 days',
    '08:30 AM',
    '06:00 PM',
    'University Sports Stadium & Pavilion',
    false,
    true,
    200,
    'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Campus Smash: Inter-Department Cricket Tournament');

INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'ByteBattle: 3-Hour Algorithmic Speed Challenge',
    'Test your data structures and algorithm prowess against top collegiate coders. 6 challenging problems ranging from dynamic programming to graph theory. Compete on our automated judge platform with live scoreboards.',
    'Competition',
    CURRENT_DATE + INTERVAL '18 days',
    '04:00 PM',
    '07:30 PM',
    'Central Computing Center, Lab A & B',
    false,
    true,
    150,
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'ByteBattle: 3-Hour Algorithmic Speed Challenge');

INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'Tech Horizons: Navigating Careers & Tech Mentorship',
    'Connect directly with alumni working at Google, Microsoft, Amazon, and breakout startups. Get insider tips on resume building, cracking technical interviews, contributing to open-source, and finding off-campus opportunities.',
    'Career',
    CURRENT_DATE + INTERVAL '25 days',
    '03:00 PM',
    '06:00 PM',
    'Auditorium Hall 1, Management Block',
    false,
    true,
    250,
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Tech Horizons: Navigating Careers & Tech Mentorship');

INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'National Youth Parliamentary Debate: Tech & Society',
    'A prestigious debate gathering articulate voices across disciplines to deliberate on AI ethics, digital privacy regulation, and intellectual property in the generative age. Form a delegation or register as an individual orator.',
    'Literary',
    CURRENT_DATE + INTERVAL '32 days',
    '10:00 AM',
    '05:00 PM',
    'Senate Hall, Administrative Tower',
    false,
    true,
    100,
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'National Youth Parliamentary Debate: Tech & Society');

INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'Apex Arena: Valorant & EA Sports FC Campus Cup',
    'The ultimate collegiate gaming showdown! 5v5 tactical shooter brackets for Valorant and 1v1 console battles for EA Sports FC 26. LAN setup, high refresh rate displays, live caster stream, and energy refreshments provided.',
    'Gaming',
    CURRENT_DATE + INTERVAL '16 days',
    '11:00 AM',
    '08:00 PM',
    'Student Activity Center (SAC) Level 2',
    false,
    true,
    160,
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Apex Arena: Valorant & EA Sports FC Campus Cup');

INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, featured, registration_open, max_capacity, image_url, created_at, updated_at)
SELECT
    'Introduction to Web3 & Smart Contracts',
    'A beginner seminar uncovering blockchain primitives, Ethereum architecture, and deploying your very first Solidity contract on Sepolia testnet. Concluded with great participation and project submissions.',
    'Seminar',
    CURRENT_DATE - INTERVAL '15 days',
    '02:00 PM',
    '05:00 PM',
    'Virtual Auditorium (Zoom)',
    false,
    false,
    200,
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Introduction to Web3 & Smart Contracts');

-- 2. Optional Sample Registrations
INSERT INTO registrations (event_id, name, email, college, year, phone, registered_at)
SELECT
    e.id,
    'Aarav Sharma',
    'aarav.sharma@example.edu',
    'Institute of Engineering & Tech',
    '3rd Year',
    '+91 98765 43210',
    CURRENT_TIMESTAMP
FROM events e
WHERE e.title = 'Nexus Hackathon 2026: Code the Future'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.email = 'aarav.sharma@example.edu');

INSERT INTO registrations (event_id, name, email, college, year, phone, registered_at)
SELECT
    e.id,
    'Sneha Kulkarni',
    'sneha.k@example.edu',
    'St. Xavier''s Engineering College',
    '1st Year',
    '+91 98345 67890',
    CURRENT_TIMESTAMP
FROM events e
WHERE e.title = 'Full-Stack Mastery: Spring Boot 3 & Modern React'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.email = 'sneha.k@example.edu');
