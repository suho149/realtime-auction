package io.github.suho149.realtime_auction.global.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file) {
        // 파일 이름 고유하게 만들기
        String originalFileName = file.getOriginalFilename();
        String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String storedFileName = UUID.randomUUID().toString() + extension;

        Path targetLocation = Paths.get(uploadDir + File.separator + storedFileName);

        try {
            // 디렉토리가 없으면 생성
            Files.createDirectories(targetLocation.getParent());
            // 파일 저장
            Files.copy(file.getInputStream(), targetLocation);

            // 저장된 파일의 접근 URL 반환 (예: /images/filename.jpg)
            return "/images/" + storedFileName;
        } catch (IOException ex) {
            throw new RuntimeException("파일을 저장할 수 없습니다. 파일 이름: " + storedFileName, ex);
        }
    }
}
