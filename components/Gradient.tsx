import { LinearGradient } from 'expo-linear-gradient';
import { withUniwind } from 'uniwind';

/**
 * Uniwind-aware LinearGradient. Accepts `className` for layout/sizing.
 * Use the `colors` prop for gradient stops (read from useThemeColor when theme-bound).
 */
export const Gradient = withUniwind(LinearGradient);
