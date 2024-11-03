# TonyAI Workshop

A sophisticated AI system combining swarm intelligence, tactical awareness, and advanced memory systems.

## Features

- Multi-agent swarm system with primary and support agents
- Advanced spatial awareness using Mapbox
- Tactical overlay system for situational awareness
- Self-evaluating trainer component
- Real-time voice synthesis
- Industrial warehouse aesthetic UI

## Development

```bash
npm install
npm run dev
```

## Deployment

This project is configured for deployment on Hugging Face Spaces using Docker. The application will be available on port 7860.

### Environment Variables

Required environment variables:
- MAPBOX_ACCESS_TOKEN
- LIVEKIT_API_KEY
- LIVEKIT_SECRET_KEY
- OPENAI_API_KEY
- HUGGINGFACE_API_KEY

## Docker

To build and run locally:

```bash
docker build -t tonyai-workshop .
docker run -p 7860:7860 tonyai-workshop
```