import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, tool, UIMessage } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Initialize the free database connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // Parse and type the incoming messages array from the frontend hook
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: await convertToModelMessages(messages),
    
    // Enable the multi-step agent feedback loop
    // This allows Gemini to execute a tool AND continue generating a text response afterwards!
    maxSteps: 5, 

    system: `You are the autonomous AI assistant for Boston Balloon Factory. 
    Tone: Friendly, brief, and highly execution-focused.
    
    RULES:
    1. Operating Areas: We only deliver to Greater Boston (Quincy, Weymouth, Braintree, Newton, Cambridge). If a user asks for a delivery outside of these cities, politely decline and offer a warehouse pickup instead.
    2. Pricing: 6ft Garlands are exactly $150. 12ft Arches are exactly $300. There is a flat $50 delivery fee for all dropped orders.
    3. Delivery Minimum: We have a strict minimum order total of $200 required for a guaranteed delivery slot. If their order is under $200 (like just a 6ft garland), tell them they must either add an item or choose a 'Grab & Go' warehouse pickup.
    
    CRITICAL STEP: The moment a customer explicitly states their Name, Phone Number, and what they want to order (Event Details), you MUST immediately call the 'captureLeadInDatabase' tool to save their information. Do not wait for them to ask you to save it.
    
    CONVERSATIONAL FOLLOW-UP: Once the 'captureLeadInDatabase' tool executes successfully and returns a success status, you MUST continue to step 2 and speak directly to the customer. Thank them warmly by name, confirm their order details are securely saved, and let them know that a text message containing their secure Stripe deposit checkout link is being generated right now to lock in their date.`,
    
    tools: {
      captureLeadInDatabase: tool({
        description: 'Autonomously saves verified local customer booking and intake leads straight into the database table.',
        inputSchema: z.object({
          name: z.string().describe('The first and last name of the customer.'),
          phone: z.string().describe('The direct contact mobile phone number of the customer.'),
          details: z.string().describe('Summary of their event dates, location, balloon sizes, and chosen color palettes.'),
        }),
        execute: async ({ name, phone, details }) => {
          console.log(`🤖 AI triggered tool use execution for: ${name}`);
          
          // Insert data row directly into Supabase
          const { error } = await supabase
            .from('sandbox_leads')
            .insert([{ customer_name: name, customer_phone: phone, event_details: details }]);
            
          if (error) {
            console.error('Supabase Error:', error);
            return { status: 'error', message: 'Failed to write record.' };
          }
          
          return { status: 'success', message: 'Lead securely committed to system logs.' };
        },
      }),
    },
  });

  // Return the explicit UI stream response token
  return result.toUIMessageStreamResponse();
}

// Baseline verification route for health checks
export async function GET() {
  return Response.json({ 
    status: "The Factory Engine is Alive!",
    client: "Boston Balloon Factory"
  });
}