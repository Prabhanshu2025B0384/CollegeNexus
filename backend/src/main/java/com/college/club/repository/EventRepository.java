package com.college.club.repository;

import com.college.club.entity.Event;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Optional<Event> findByIdForUpdate(@Param("id") Long id);

    List<Event> findAllByOrderByEventDateAsc();

    Optional<Event> findFirstByFeaturedTrueOrderByEventDateAsc();

    List<Event> findByFeaturedTrue();

    List<Event> findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate date);

    List<Event> findByCategoryIgnoreCaseOrderByEventDateAsc(String category);

    @Query("SELECT e FROM Event e WHERE " +
           "(:category IS NULL OR :category = '' OR LOWER(e.category) = LOWER(:category)) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.venue) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY e.eventDate ASC")
    List<Event> searchEvents(@Param("search") String search, @Param("category") String category);

    long countByEventDateGreaterThanEqual(LocalDate date);

    @Query("SELECT DISTINCT e.category FROM Event e ORDER BY e.category ASC")
    List<String> findDistinctCategories();
}
