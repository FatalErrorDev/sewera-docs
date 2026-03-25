---
title: Getting Started with Claude
description: Your first steps to using Claude effectively for building company support systems.
order: 4
---

# Getting Started with Claude

Claude is a powerful AI assistant that can help you build intelligent support systems. This guide will walk you through the fundamentals.

## What You'll Learn

- How to craft effective prompts for support scenarios
- Setting up your first Claude-powered workflow
- Best practices for production deployments

## Prerequisites

Before you begin, make sure you have:

- An Anthropic API key (sign up at anthropic.com)
- Basic familiarity with REST APIs
- A text editor or IDE of your choice

## Your First Prompt

Here's a simple example of a support agent prompt:

```
You are a helpful customer support agent for Acme Corp.
You have access to our knowledge base and can help customers
with billing questions, technical issues, and general inquiries.

Always be polite, concise, and accurate. If you don't know
the answer, say so and offer to escalate to a human agent.
```

Try sending this as a system prompt with a sample customer question to see how Claude responds.

## Understanding Responses

Claude will generate responses based on the context you provide. Key things to note:

- **Temperature**: Lower values (0.0-0.3) produce more consistent responses, ideal for support
- **Max tokens**: Set appropriate limits to keep responses concise
- **System prompts**: These shape Claude's behavior throughout the conversation

## Next Steps

Once you're comfortable with basic prompts, move on to [Using Claude with Lovable](/docs/tutorials/02-claude-and-lovable) to learn about building web-based support interfaces.
