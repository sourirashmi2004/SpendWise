package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import com.expensetracker.entity.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE (c.user IS NULL OR c.user.id = :userId) AND c.type = :type ORDER BY c.name ASC")
    List<Category> findAvailableByUserAndType(Long userId, CategoryType type);

    @Query("SELECT c FROM Category c WHERE c.user IS NULL OR c.user.id = :userId ORDER BY c.type ASC, c.name ASC")
    List<Category> findAllAvailableForUser(Long userId);

    Optional<Category> findByNameIgnoreCaseAndTypeAndUserIsNull(String name, CategoryType type);
}
