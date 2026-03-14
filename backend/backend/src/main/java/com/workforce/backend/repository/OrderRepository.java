package com.workforce.backend.repository;

import com.workforce.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(String status);
    List<Order> findByCustomerName(String customerName);
    List<Order> findAllByOrderByCreatedAtDesc();
    Optional<Order> findByOrderId(String orderId);
}
