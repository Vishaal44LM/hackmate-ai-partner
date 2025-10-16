interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export async function callEdgeFunctionWithRetry(
  url: string,
  body: object,
  config: RetryConfig = {}
): Promise<any> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 5000 } = config;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt + 1} failed:`, error);
      
      // Don't retry on the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay = Math.min(
          initialDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Failed to call edge function");
}
