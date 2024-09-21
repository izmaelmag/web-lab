import React from 'react';
import { validate } from 'jsonschema';
import resumeSchema from './resume-schema.json';
import type { Resume as ResumeDocument } from '../../types/resume';
import ReactPDF from '@react-pdf/renderer';
import { stream2buffer } from '../../utils/stream2buffer';
import { BasicTemplate } from './template/basic';

export class Resume {
  resume: ResumeDocument;
  isValid = false;
  error = '';
  schema = resumeSchema;

  constructor(resume: ResumeDocument) {
    this.resume = resume;

    this.validate();
  }

  validate() {
    const { valid, errors } = validate(this.resume, this.schema);

    if (valid) {
      this.isValid = true;
    } else {
      this.error = errors[0].property;
    }

    return this;
  }

  async render() {
    if (this.isValid) {
      const documentStream = await ReactPDF.renderToStream(<BasicTemplate data={this.resume} />);
      return await stream2buffer(documentStream);
    } else {
      throw Error(`Resume class error: ${this.error}`);
    }
  }
}
