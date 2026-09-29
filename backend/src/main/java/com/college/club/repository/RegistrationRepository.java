package com.college.club.repository;

import com.college.club.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByEventIdOrderByRegisteredAtDesc(Long eventId);

    List<Registration> findAllByOrderByRegisteredAtDesc();

    boolean existsByEventIdAndEmailIgnoreCase(Long eventId, String email);

    long countByEventId(Long eventId);

    @Query("SELECT r.event.id, COUNT(r) FROM Registration r WHERE r.event.id IN :eventIds GROUP BY r.event.id")
    List<Object[]> countRegistrationsByEventIds(@Param("eventIds") List<Long> eventIds);

    @Query("SELECT r FROM Registration r JOIN FETCH r.event e WHERE " +
           "(:eventId IS NULL OR e.id = :eventId) AND " +
           "(:year IS NULL OR :year = '' OR r.year = :year) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.college) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY r.registeredAt DESC")
    List<Registration> searchRegistrations(@Param("search") String search,
                                         @Param("eventId") Long eventId,
                                         @Param("year") String year);
}
