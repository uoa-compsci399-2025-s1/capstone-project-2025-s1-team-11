![AssesslyLogoSmall](https://github.com/user-attachments/assets/26b39dbd-d35a-4127-914e-914b12a06ba4) 
# Assessly from Cache Converters
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)  ![Ant-Design](https://img.shields.io/badge/-AntDesign-%230170FE?style=for-the-badge&logo=ant-design&logoColor=white)


[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/4-04QCSZ)


## Background

Assessly is an examination builder, randomiser, marking suite, and statistics platform. Out of the box, Assessly generates four distinct versions of a provided MCQ exam accepting inputs from Docx, Moodle XML, and LATEX. Assesly shuffles the multiple-choice answer options creating unique marking scripts for each version. 

Assessly is a Front-End Heavy, Client-Side Rendering application, meaning, very little work is done by the server. A flask server is being used solely for interoperability with existing services managed by the University of Auckland's Computer Science department, this could be replaced by a CDN or static site server, or another framework if needed. For development, you can either use this service with the Flask server-side backend or without it.

## Getting Started

### Prerequisites

In order to install and use Assessly, you will need to install:

- [Node.js](https://nodejs.org/en)
- [Chromium Based Browser](https://en.wikipedia.org/wiki/Chromium_(web_browser))

### Installation

#### 1. Client-side 
1. Navigate to client directory ```cd client```
2. Install npm prerequisites ```npm install```

#### 2. Server-side (optional)
5. Navigate to client directory ```cd ../server```
6. Open the backend folder and create a venv ```cd <path>/backend``` ```python -m venv /.venv```
7. Still in the backend folder, run ```pip install -r requirements.txt```

### Running the Development Environment

#### Option 1. Clientside development environment (recommended)
1. Start the clientside development environment using ```npm run dev```

#### Option 2. Serverside development environment
1. Start the server using ```cd <path>/backend``` and running ```python app.py```
2. Run ```npm run build``` to create a distributable - you can run this anytime you want to update what the server is sending.

## Usage
> [!WARNING]  
> Assessly is in development. Features should be complete, however bugs are expected. Please report any bugs you encounter to Team 11.

### 1. Building an exam

### 2. Preparing it for export

### 3. Marking and reviewing statistics

## Future Roadmap

- [ ] Add some items to the future roadmap

## Contributors

Cache Converters (Team 11):
* Michael Connaughton
* William Titchener
* Brodie McInnes
* Danny Weng
* Dhruv Johar
* Ollie O’Loughlin




## Acknowledgments

