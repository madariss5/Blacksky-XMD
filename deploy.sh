#!/bin/bash

echo "🚀 Deploying to Heroku..."

# Push to Heroku
git push heroku main

# Scale dynos
heroku ps:scale web=1 worker=0

# Show logs
echo "📋 Checking logs..."
heroku logs --tail
