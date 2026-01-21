package dev.gustavorosa.cpsystem.utils;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class NameUtilsTest {

    @Test
    void toTitleCase_shouldFormatNormalName() {
        assertEquals("Gustavo Rosa", NameUtils.toTitleCase("GUSTAVO ROSA"));
        assertEquals("Gustavo Rosa", NameUtils.toTitleCase("gustavo rosa"));
        assertEquals("Gustavo Rosa", NameUtils.toTitleCase("gUsTaVo rOsA"));
    }

    @Test
    void toTitleCase_shouldHandleMultipleSpaces() {
        assertEquals("Gustavo Rosa", NameUtils.toTitleCase("  gustavo    rosa  "));
    }

    @Test
    void toTitleCase_shouldReturnNullForNullInput() {
        assertNull(NameUtils.toTitleCase(null));
    }

    @Test
    void toTitleCase_shouldReturnEmptyForEmptyInput() {
        assertEquals("", NameUtils.toTitleCase(""));
        assertEquals("   ", NameUtils.toTitleCase("   "));
    }

    @Test
    void toTitleCase_shouldHandleSingleWord() {
        assertEquals("Gustavo", NameUtils.toTitleCase("gustavo"));
    }
}

