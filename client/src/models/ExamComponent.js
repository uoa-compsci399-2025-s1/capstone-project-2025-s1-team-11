export default class ExamComponent {
    constructor({
        componentType = 'Content', //Component Body
        content = '', 
        format = 'HTML',
    } = {}) {
        this.componentType = componentType;
        this.content = content;
        this.format = format;

        this.pageBreakAfter = false;
    }

    toJSON() {
        return {
            componentType: this.componentType,
            content: this.content,
            format: this.format,
            pageBreakAfter: this.pageBreakAfter,
        }
    }

    static fromJSON(data) {
        return new ExamComponent(data);
    }
}

