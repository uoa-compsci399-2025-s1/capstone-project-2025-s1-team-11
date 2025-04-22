Assessly Formats  
**Import Formats**  
 

| Import Source | Formats | Notes |
| :---- | :---- | :---- |
| **MS Word** | [DOCX Transitional (Office Open XML), ISO 29500:2008-2016](https://www.loc.gov/preservation/digital/formats/fdd/fdd000397.shtml)  | docx is a zip file containing xmls and media Uses the Office Open XML standard For our purposes different versions at least from 2010 should be [cross-compatible](https://support.microsoft.com/en-us/office/compatibility-changes-between-versions-692289af-b760-4698-8326-14b2edcd6552). |
| **Inspera** | [QTI version 2.1](https://www.1edtech.org/standards/qti/index#QTI21) \* [QTI version 2.2](https://www.1edtech.org/standards/qti/index#QTI22)  | User does not always get a choice [which version is exported](https://support.inspera.com/hc/en-us/articles/360034609012-Export-questions-and-question-sets-to-QTI). Canvas is open source and has QTI import/export \- [their code](https://github.com/instructure/canvas-lms/blob/aa917b3a3f5fe66d4acf033802e2c33897ef695c/lib/cc/qti/qti_generator.rb#L22) may be useful. |
| **Coderunner** | Aiken [GIFT](https://docs.moodle.org/405/en/GIFT_format) [Moodle XML](https://docs.moodle.org/39/en/Moodle_XML_format) \* XHTML | We should choose which of these formats to support. Moodle XML probably a good one due to existing converters with other exam formats and gives us bonus functionality of supporting Moodle users. |
| LaTeX | [LaTeX](https://en.wikipedia.org/wiki/LaTeX)  | Provided exam\_2025SS.tex exam uses the LateX [exam document class](https://math.mit.edu/~psh/exam/examdoc.pdf) \- there is not much constraint on how lecturers will use this so like with docx we may have to drop formatting that falls outside a scope. |
| Not required but possible future targets | Canvas QTI 2.1  | Including Canvas since it can export one of the two formats used by Inspera. |

\* probable targets

**Assessly Memory Representation**

Current data model and structure concept for memory exam representation:  
[![Data model class diagram](https://github.com/user-attachments/assets/ab91e4c1-2c0b-416c-82ea-05aab8c8e364)](https://editor.plantuml.com/uml/dL9DRzim3BtxLn3URNFSk6ilExKfTjcXwv2ZuOCYqQaMI_8eUMqmxBzFRAmeIu5XQ1308X_9z_XnuuEWC9cXa8Fm7Zu_2mE_2e0FFf2sMmWw3CZsdRC1RLWDJkv0kfz83sBxWd3EdJEZin5lEy1Jsx_A5UE8Lkbd1jpcEqhECHY44a40UmMHsBS_9lH1EmllkbOweXW8mled91YTrmorKOMFtwu28sZdExYu0AotDRHjixowhg3fgdRvyUeolkhh65RNDNJ5xoAtcwN-rRTMfqFOZmXSk_GecRYie4pw-2qF3PQSit5kG65XZEDP4OhTRH-GCkVwK2AEAQQeVsZ8ixUJsI31J7x_OftFDQ6pZ-5liy8utoJMPnsClb48LyjACd3OGhOZCKj3zJ0lpFCG_OXIznhzSO_W-Zbmth2VjxXegiE_gIwxLnqd6IkdzkTWswLIJ2bacCIGF5dWCMgDiPYL68DHo4V00GrFWN0az7p7843flaUAHhf34bOvexrW5RagpETwUnGmsHIAYj5K9BVQBECFUaVGQ_89J9Noravx_8_DpOUPFKnXH3XSCuMUhvUtfjoJvVTZC0D_lwo_tfU0GTRCpGHGDYMyNomutkxBCz9Fu4WXeO91-r2a8p_BIJTNt4JTand-0000)![Exam components structure](https://github.com/user-attachments/assets/38f89771-b842-44cf-9770-c9995e5e96ab)

**Content representation in the model:**  
The document content for questions/sections is stored in ExamComponent’s content variable as a string. That is all the supporting information in each section/question.  Currently there is no in-model storage for images, assuming that providing images references in the content string is sufficient.  The content string is expected to be structured as HTML since this should capture enough document formatting for exams while being easy to display in the UI and export to pdf etc. We could equally use Markdown/RTF/LaTeX, or if we want to constrain things more we could use a custom Content class instead of a string.

![Content diagram](https://github.com/user-attachments/assets/f409ff8a-0e01-4582-8c9d-76d12bd2344a)

**Assessly Save File Format**

JSON…  
Contains 

* Model data  
* Exam metadata  
* Randomisation keys?

Folder for images?  
Marking Key JSON/csv  
Zip to package all exported files?

**Export Formats**

| Formats | Notes |
| :---- | :---- |
| [DOCX Transitional (Office Open XML), ISO 29500:2008-2016](https://www.loc.gov/preservation/digital/formats/fdd/fdd000397.shtml)  | For making small edits |
| PDF |  |
