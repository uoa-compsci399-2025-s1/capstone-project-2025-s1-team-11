![AssesslyLogoSmall](https://github.com/user-attachments/assets/26b39dbd-d35a-4127-914e-914b12a06ba4) 
# Assessly from Cache Converters

[![Static Badge](https://img.shields.io/badge/Live%20Demo-x?style=for-the-badge&logo=netlify&color=eeeeee)](https://assesslyuoa.netlify.app)
[![Static Badge](https://img.shields.io/badge/Jira%20Project%20Management-x?style=for-the-badge&logo=jira&color=527ef7)](https://team11-cache-converters.atlassian.net/jira/software/projects/T11P3CC/boards/68)
[![Static Badge](https://img.shields.io/badge/Final%20Report-x?style=for-the-badge&logo=googledocs&color=3d3d3d)](https://docs.google.com/document/d/1Wwr19Xu3Y3sycnT4Y5coCA9t3XetkyTxE-S2K-7WXjk/edit?tab=t.0)

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

### 1. Building an exam

https://github.com/user-attachments/assets/872ba7e9-bf92-4773-b73c-474699309cbe

### 2. Preparing it for export

https://github.com/user-attachments/assets/dda0dffc-9c78-4443-bbbb-d5a7c611b7af

### 3. Marking and reviewing statistics

https://github.com/user-attachments/assets/234d4dfd-7db4-4c17-a391-246ac26f84c5

## Technologies
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)  ![Ant-Design](https://img.shields.io/badge/-AntDesign-%230170FE?style=for-the-badge&logo=ant-design&logoColor=white)

### Languages
- Javascript
- HTML
- CSS

### Key Technologies
- antd@5.25.2
- babel-jest@30.0.0
- cypress@14.3.3
- eslint@9.27.0
- globals@15.15.0
- jest@29.7.0
- jsdom@26.1.0
- lefthook@1.11.13
- lodash-es@4.17.21
- react@19.1.0
  - react-dom@19.1.0
- react-redux@9.2.0
- react-router@7.6.0
  - react-router-dom@7.6.0
- recharts@2.15.3
- redux-mock-store@1.5.5
- start-server-and-test@2.0.12
- vite@6.3.5

### Parsing and exam editing Technologies
- docxtemplater@3.62.2
- exceljs@4.4.0
- fast-xml-parser@5.2.3
- html2canvas@1.4.1
- identity-obj-proxy@3.0.0
- katex@0.16.22
- tiptap@2.12.0

### File Handling Technologies
- file-saver@2.0.5
- jszip@3.10.1
- pizzip@3.2.0

## Links

- [Live Demo](https://assesslyuoa.netlify.app)
- [Jira Project](https://team11-cache-converters.atlassian.net/jira/software/projects/T11P3CC/boards/68)
- [Final Report](https://docs.google.com/document/d/1Wwr19Xu3Y3sycnT4Y5coCA9t3XetkyTxE-S2K-7WXjk/edit?tab=t.0)


## Future Roadmap

- [ ] **PDF Teleform Reader** Using either a conventional mechanism, or machine learning/AI to read the teleform sheets as scanned from a normal scanner. I.e. a user scans a stack of teleform sheets using a conventional scanner, which are then uploaded to Assessly, where they can be automatically read and marked.
- [ ] **LMS Question Importing** Direct Integration allowing users to open an exam from Moodle, Canvas or other sources, just by pressing a button, rather than downloading and re-uploading the export files. 
- [ ] **LMS Score Exporting** Direct Integration allowing users to automatically transfer detailed results from Assessly to an LMS for storing within the gradebook. This could potentially allow for per question grading to be uploaded to the LMS, in addition to the total grades currently uploaded.
- [ ] **Deeper Results Analytics** of student exam data to allow greater options and enhanced reporting capabilities.



## Contributors

Cache Converters (Team 11):
* Michael Connaughton
* William Titchener
* Brodie McInnes
* Danny Weng
* Dhruv Johar
* Ollie O’Loughlin

## Acknowledgments
Cache Converters acknowledge the following people for their support and guidance during the development of Assessly:

### Project Client
- Angela Chang
### Project Supervisor
- Asma Shakil
### Project Tutor/Mentor
- Brenda San German Bravo
