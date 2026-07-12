'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import PostHogPageView from "./posthog/PostHogPageView"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

        // Only initialize if we have the required environment variables
        if (posthogKey && posthogHost) {
            posthog.init(posthogKey, {
                api_host: posthogHost,
                person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
                capture_pageview: false // Disable automatic pageview capture, as we capture manually
            });
        } else {
            console.warn('PostHog environment variables are not set. Analytics will be disabled.');
        }
    }, []);

    return (
        <PHProvider client={posthog}>
            <PostHogPageView />
            {children}
        </PHProvider>
    );
}