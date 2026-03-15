package com.quantify.repository;

import com.quantify.model.ChatSession;
import com.quantify.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findByUserOrderByUpdatedAtDesc(User user);

    Optional<ChatSession> findByIdAndUser(Long id, User user);

    Optional<ChatSession> findFirstByUserOrderByUpdatedAtDesc(User user);

    void deleteByIdAndUser(Long id, User user);
}
