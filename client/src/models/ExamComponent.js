

export default class ExamComponent {
    constructor(componentType = 'content', content = '', format = 'HTML') {
        this.componentType = componentType;
        this.content = content;
        this.format = 'HTML';

        this.pageBreakAfter = false;
    }
}