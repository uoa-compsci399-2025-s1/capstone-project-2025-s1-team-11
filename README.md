# Assessly 


[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/4-04QCSZ)


## Background

Assessly is a Front-End Heavy, Client-Side Rendering application, meaning, very little work is done by the server. A flask server is being used solely for interoperability with existing services managed by the University of Auckland's Computer Science department, this could be replaced by a CDN or static site server, or another framework if needed. For development, you can either use this service with the Flask server-side backend or without it.

Assessly creates a save file which contains exam data.

## Installation

### Prerequisites
- Node.js
- Python
- Chromium based browser (filesystem api requires chromium). 

### Installation

#### 1. Client-side
1. Install npm prerequisites ```npm install```
2. Install Ant Design - run ```npm install antd --save```

#### 2. Server-side
3. Open the backend folder and create a venv ```cd <path>/backend``` ```python -m venv /.venv```
4. Still in the backend folder, run ```pip install -r requirements.txt```

## Running the Development Environment

#### Option 1. Clientside development environment (recommended)
1. Start the clientside development environment using ```npm run dev```

#### Option 2. Serverside development environment
1. Start the server using ```cd <path>/backend``` and running ```python app.py```
2. Run ```npm run build``` to create a distributable - you can run this anytime you want to update what the server is sending.
