/**
 * Math Blaster - Custom Math Problems Configuration
 * ============================================
 * 
 * HOW TO ADD YOUR OWN MATH PROBLEMS:
 * 
 * 1. Add problems to any difficulty level below
 * 2. Each problem must have:
 *    - problem: string (e.g., "5+3", "12×4")
 *    - answer: string (e.g., "8", "48")
 * 3. Use these operators: + - × ÷ ² ³ √ ( )
 * 4. Easy: simple single-digit
 * 5. Normal: double-digit, basic multiplication
 * 6. Hard: complex operations
 * 7. Insane: multi-step, powers, roots
 * 
 * EXAMPLE:
 *   easy: [
 *     { problem: '3+4', answer: '7' },
 *     { problem: '9-2', answer: '7' }
 *   ]
 * 
 * To disable custom problems, set enabled to false.
 * 
 * ============================================
 */

var CUSTOM_WORDS = {

    // Set to false to ignore all custom problems
    enabled: true,

    // Set to true to ONLY use custom problems (ignores generated ones)
    // Set to false to MIX custom problems with auto-generated ones
    replaceBuiltIn: false,

    words: {

        // Simple single-digit problems
        easy: [
            // Add your easy problems here
            // Example:
            // { problem: '2+3', answer: '5' },
            // { problem: '8-4', answer: '4' }
        ],

        // Double-digit and simple multiplication
        normal: [
            // Add your normal problems here
            // Example:
            // { problem: '15+12', answer: '27' },
            // { problem: '6×7', answer: '42' }
        ],

        // Complex multiplication, division, multi-step
        hard: [
            // Add your hard problems here
            // Example:
            // { problem: '12×8', answer: '96' },
            // { problem: '48÷6', answer: '8' }
        ],

        // Advanced: powers, roots, parentheses
        insane: [
            // Add your insane problems here
            // Example:
            // { problem: '5²', answer: '25' },
            // { problem: '√64', answer: '8' },
            // { problem: '(10+5)×3', answer: '45' }
        ]
    }
};

window.CUSTOM_WORDS = CUSTOM_WORDS;