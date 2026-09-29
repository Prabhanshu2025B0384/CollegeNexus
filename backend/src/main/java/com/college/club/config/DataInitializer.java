package com.college.club.config;

import com.college.club.entity.Event;
import com.college.club.entity.Registration;
import com.college.club.entity.User;
import com.college.club.repository.EventRepository;
import com.college.club.repository.RegistrationRepository;
import com.college.club.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.email:admin@collegeclub.edu}")
    private String adminEmail;

    @Value("${app.seed.sample-data:false}")
    private boolean seedSampleData;

    public DataInitializer(
            UserRepository userRepository,
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedAdminUser();
        seedEventsAndRegistrations();
    }

    private void seedAdminUser() {
        if (!userRepository.existsByUsername(adminUsername)) {
            if (adminPassword == null || adminPassword.trim().isEmpty()) {
                logger.warn("ADMIN_PASSWORD environment variable is not configured. Skipping automatic administrative user seeding.");
                return;
            }
            logger.info("Admin user '{}' not found. Seeding administrative user...", adminUsername);
            User admin = new User(
                    adminUsername,
                    adminEmail != null && !adminEmail.trim().isEmpty() ? adminEmail : "admin@collegeclub.edu",
                    passwordEncoder.encode(adminPassword.trim()),
                    "ROLE_ADMIN"
            );
            userRepository.save(admin);
            logger.info("Admin user '{}' successfully seeded.", adminUsername);
        } else {
            logger.info("Admin user '{}' already exists in database. Skipping user seeding.", adminUsername);
        }
    }

    private void seedEventsAndRegistrations() {
        if (!seedSampleData) {
            logger.info("Sample event/registration seeding is disabled (app.seed.sample-data=false). Production database will remain unpolluted.");
            return;
        }

        if (eventRepository.count() == 0) {
            logger.info("No existing events found and seedSampleData is true. Seeding initial realistic college club events...");

            LocalDate today = LocalDate.now();

            List<Event> events = new ArrayList<>();

            // 1. Featured Hackathon Event
            Event e1 = new Event();
            e1.setTitle("Nexus Hackathon 2026: Code the Future");
            e1.setDescription("Our premier 36-hour flagship hackathon bringing together over 300 passionate student developers, designers, and innovators. Tackle real-world problems in AI, Web3, FinTech, and Sustainable Tech. Enjoy round-the-clock mentorship, free meals, high-speed Wi-Fi, and compete for a prize pool exceeding $5,000 plus internship opportunities!");
            e1.setCategory("Hackathon");
            e1.setEventDate(today.plusDays(14));
            e1.setStartTime("09:00 AM");
            e1.setEndTime("09:00 PM (Next Day)");
            e1.setVenue("Campus Innovation Hub & Main Auditorium");
            e1.setFeatured(true);
            e1.setRegistrationOpen(true);
            e1.setMaxCapacity(350);
            e1.setImageUrl("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80");
            events.add(e1);

            // 2. Technical Workshop
            Event e2 = new Event();
            e2.setTitle("Full-Stack Mastery: Spring Boot 3 & Modern React");
            e2.setDescription("An intensive hands-on architectural workshop designed for aspiring software engineers. Learn how to architect enterprise-grade REST APIs with Spring Security and PostgreSQL, and build sleek, reactive frontends with React, Vite, and TypeScript. Laptop required.");
            e2.setCategory("Workshop");
            e2.setEventDate(today.plusDays(7));
            e2.setStartTime("10:00 AM");
            e2.setEndTime("04:30 PM");
            e2.setVenue("Computer Science Lab 3, Block B");
            e2.setFeatured(false);
            e2.setRegistrationOpen(true);
            e2.setMaxCapacity(80);
            e2.setImageUrl("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80");
            events.add(e2);

            // 3. Technical Hands-on
            Event e3 = new Event();
            e3.setTitle("Cloud & DevOps: Docker, Kubernetes & AWS Essentials");
            e3.setDescription("Learn modern cloud infrastructure from industry DevOps practitioners. Cover Docker containerization, container orchestration basics with Kubernetes, and production deployment automation using AWS Elastic Beanstalk and GitHub Actions.");
            e3.setCategory("Technical");
            e3.setEventDate(today.plusDays(21));
            e3.setStartTime("02:00 PM");
            e3.setEndTime("06:00 PM");
            e3.setVenue("Seminar Hall 2, Science Complex");
            e3.setFeatured(false);
            e3.setRegistrationOpen(true);
            e3.setMaxCapacity(120);
            e3.setImageUrl("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80");
            events.add(e3);

            // 4. Cultural Fest
            Event e4 = new Event();
            e4.setTitle("Aura 2026: Annual Inter-College Cultural Extravaganza");
            e4.setDescription("The most vibrant night of the semester! Experience electrifying music band battles, contemporary dance showdowns, theatrical drama performances, and gourmet street food stalls organized by college student chapters across the region.");
            e4.setCategory("Cultural");
            e4.setEventDate(today.plusDays(28));
            e4.setStartTime("05:00 PM");
            e4.setEndTime("10:30 PM");
            e4.setVenue("University Open Air Amphitheatre");
            e4.setFeatured(false);
            e4.setRegistrationOpen(true);
            e4.setMaxCapacity(1000);
            e4.setImageUrl("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80");
            events.add(e4);

            // 5. Sports Tournament
            Event e5 = new Event();
            e5.setTitle("Campus Smash: Inter-Department Cricket Tournament");
            e5.setDescription("Get ready for the highest-stakes cricket tournament of the year! 16 departmental teams battle it out across 4 days in a high-voltage T10 format. Cheer for your branch, witness thrilling super-overs, and take home the coveted Chancellor's Trophy.");
            e5.setCategory("Sports");
            e5.setEventDate(today.plusDays(10));
            e5.setStartTime("08:30 AM");
            e5.setEndTime("06:00 PM");
            e5.setVenue("University Sports Stadium & Pavilion");
            e5.setFeatured(false);
            e5.setRegistrationOpen(true);
            e5.setMaxCapacity(200);
            e5.setImageUrl("https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80");
            events.add(e5);

            // 6. Competitive Programming
            Event e6 = new Event();
            e6.setTitle("ByteBattle: 3-Hour Algorithmic Speed Challenge");
            e6.setDescription("Test your data structures and algorithm prowess against top collegiate coders. 6 challenging problems ranging from dynamic programming to graph theory. Compete on our automated judge platform with live scoreboards.");
            e6.setCategory("Competition");
            e6.setEventDate(today.plusDays(18));
            e6.setStartTime("04:00 PM");
            e6.setEndTime("07:30 PM");
            e6.setVenue("Central Computing Center, Lab A & B");
            e6.setFeatured(false);
            e6.setRegistrationOpen(true);
            e6.setMaxCapacity(150);
            e6.setImageUrl("https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80");
            events.add(e6);

            // 7. Career & Networking
            Event e7 = new Event();
            e7.setTitle("Tech Horizons: Navigating Careers & Tech Mentorship");
            e7.setDescription("Connect directly with alumni working at Google, Microsoft, Amazon, and breakout startups. Get insider tips on resume building, cracking technical interviews, contributing to open-source, and finding off-campus opportunities.");
            e7.setCategory("Career");
            e7.setEventDate(today.plusDays(25));
            e7.setStartTime("03:00 PM");
            e7.setEndTime("06:00 PM");
            e7.setVenue("Auditorium Hall 1, Management Block");
            e7.setFeatured(false);
            e7.setRegistrationOpen(true);
            e7.setMaxCapacity(250);
            e7.setImageUrl("https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80");
            events.add(e7);

            // 8. Literary & Debate
            Event e8 = new Event();
            e8.setTitle("National Youth Parliamentary Debate: Tech & Society");
            e8.setDescription("A prestigious debate gathering articulate voices across disciplines to deliberate on AI ethics, digital privacy regulation, and intellectual property in the generative age. Form a delegation or register as an individual orator.");
            e8.setCategory("Literary");
            e8.setEventDate(today.plusDays(32));
            e8.setStartTime("10:00 AM");
            e8.setEndTime("05:00 PM");
            e8.setVenue("Senate Hall, Administrative Tower");
            e8.setFeatured(false);
            e8.setRegistrationOpen(true);
            e8.setMaxCapacity(100);
            e8.setImageUrl("https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80");
            events.add(e8);

            // 9. Gaming / Esports
            Event e9 = new Event();
            e9.setTitle("Apex Arena: Valorant & EA Sports FC Campus Cup");
            e9.setDescription("The ultimate collegiate gaming showdown! 5v5 tactical shooter brackets for Valorant and 1v1 console battles for EA Sports FC 26. LAN setup, high refresh rate displays, live caster stream, and energy refreshments provided.");
            e9.setCategory("Gaming");
            e9.setEventDate(today.plusDays(16));
            e9.setStartTime("11:00 AM");
            e9.setEndTime("08:00 PM");
            e9.setVenue("Student Activity Center (SAC) Level 2");
            e9.setFeatured(false);
            e9.setRegistrationOpen(true);
            e9.setMaxCapacity(160);
            e9.setImageUrl("https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80");
            events.add(e9);

            // 10. Past Event (to demonstrate realistic date sorting and past events view)
            Event e10 = new Event();
            e10.setTitle("Introduction to Web3 & Smart Contracts");
            e10.setDescription("A beginner seminar uncovering blockchain primitives, Ethereum architecture, and deploying your very first Solidity contract on Sepolia testnet. Concluded with great participation and project submissions.");
            e10.setCategory("Seminar");
            e10.setEventDate(today.minusDays(15));
            e10.setStartTime("02:00 PM");
            e10.setEndTime("05:00 PM");
            e10.setVenue("Virtual Auditorium (Zoom)");
            e10.setFeatured(false);
            e10.setRegistrationOpen(false);
            e10.setMaxCapacity(200);
            e10.setImageUrl("https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80");
            events.add(e10);

            List<Event> savedEvents = eventRepository.saveAll(events);
            logger.info("Successfully seeded {} events.", savedEvents.size());

            // Seed realistic dummy registrations for the first two events
            Event hackathon = savedEvents.get(0);
            Event workshop = savedEvents.get(1);

            List<Registration> dummyRegistrations = List.of(
                    new Registration(hackathon, "Aarav Sharma", "aarav.sharma@example.edu", "Institute of Engineering & Tech", "3rd Year", "+91 98765 43210"),
                    new Registration(hackathon, "Ananya Iyer", "ananya.iyer@example.edu", "City College of Technology", "2nd Year", "+91 98123 45678"),
                    new Registration(hackathon, "Rohan Verma", "rohan.verma@example.edu", "State University Tech Campus", "4th Year", "+91 98234 56789"),
                    new Registration(workshop, "Sneha Kulkarni", "sneha.k@example.edu", "St. Xavier's Engineering College", "1st Year", "+91 98345 67890"),
                    new Registration(workshop, "Vikramaditya Roy", "vikram.roy@example.edu", "Apex Institute of Science", "3rd Year", "+91 98456 78901"),
                    new Registration(workshop, "Pooja Hegde", "pooja.h@example.edu", "Metropolitan Technical Institute", "2nd Year", "+91 98567 89012")
            );

            registrationRepository.saveAll(dummyRegistrations);
            logger.info("Successfully seeded {} dummy registrations.", dummyRegistrations.size());
        } else {
            logger.info("Event database already initialized with {} events. Skipping seeding.", eventRepository.count());
        }
    }
}
