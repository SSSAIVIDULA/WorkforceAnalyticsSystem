package com.workforce.backend.controller;

import com.workforce.backend.model.Order;
import com.workforce.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    // ✅ CREATE ORDER
    @PostMapping("/placeOrder")
    public Order placeOrder(@RequestBody Order order) {
        order.setOrderId("ORD" + System.currentTimeMillis());
        order.setStatus("Pending");
        return orderRepository.save(order);
    }

    // ✅ GET ORDER BY ID
    @GetMapping("/orderByCode")
    public Order getOrder(@RequestParam String orderId) {
        Optional<Order> order = orderRepository.findByOrderId(orderId);
        return order.orElse(null);
    }

    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}