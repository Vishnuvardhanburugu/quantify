package com.quantify.repository;

import com.quantify.model.ChatMessage;
import com.quantify.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionOrderByCreatedAtAsc(ChatSession session);

    List<ChatMessage> findTop10BySessionOrderByCreatedAtDesc(ChatSession session);
}
