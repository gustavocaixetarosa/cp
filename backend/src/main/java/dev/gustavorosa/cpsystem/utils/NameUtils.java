package dev.gustavorosa.cpsystem.utils;

public class NameUtils {

    public static String toTitleCase(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }

        StringBuilder result = new StringBuilder();
        String[] words = input.trim().toLowerCase().split("\\s+");

        for (int i = 0; i < words.length; i++) {
            if (!words[i].isEmpty()) {
                result.append(Character.toUpperCase(words[i].charAt(0)));
                if (words[i].length() > 1) {
                    result.append(words[i].substring(1));
                }
                if (i < words.length - 1) {
                    result.append(" ");
                }
            }
        }

        return result.toString();
    }
}

