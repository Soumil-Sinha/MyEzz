/**
 * Root Layout - Expo Router
 * Configures navigation stack and global providers
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../theme';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="dark" backgroundColor={theme.colors.background} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor: theme.colors.background,
                    },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="loading" />
                <Stack.Screen name="results" />
            </Stack>
        </>
    );
}
