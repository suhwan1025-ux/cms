/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { ClassicEditor as ClassicEditorBase } from '@ckeditor/ckeditor5-editor-classic';

// 기본 플러그인
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { Bold, Italic, Underline, Strikethrough } from '@ckeditor/ckeditor5-basic-styles';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { List, ListProperties } from '@ckeditor/ckeditor5-list';
import { Link } from '@ckeditor/ckeditor5-link';
import { Alignment } from '@ckeditor/ckeditor5-alignment';

// Table 전체 - 가장 강력한 표 기능
import { Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize } from '@ckeditor/ckeditor5-table';

// 기타 유용한 기능
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office';
import { Typing } from '@ckeditor/ckeditor5-typing';

export default class ClassicEditor extends ClassicEditorBase {}

ClassicEditor.builtinPlugins = [
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  List,
  ListProperties,
  Link,
  Alignment,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  PasteFromOffice,
  Typing
];

ClassicEditor.defaultConfig = {
  licenseKey: 'GPL', // GPL 라이선스 사용
  toolbar: {
    shouldNotGroupWhenFull: true, // 툴바 그룹화 비활성화
    items: [
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'link',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'insertTable',
      '|',
      'undo',
      'redo'
    ]
  },
  table: {
    contentToolbar: [
      'tableColumn',
      'tableRow',
      'mergeTableCells',
      'splitTableCell',
      'tableCellProperties',
      'tableProperties'
    ],
    tableProperties: {
      borderColors: [
        { color: 'hsl(0, 0%, 0%)', label: '검정' },
        { color: 'hsl(0, 0%, 30%)', label: '어두운 회색' },
        { color: 'hsl(0, 0%, 60%)', label: '회색' },
        { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
        { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true }
      ],
      backgroundColors: [
        { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true },
        { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
        { color: 'hsl(60, 75%, 60%)', label: '노랑' },
        { color: 'hsl(30, 75%, 60%)', label: '주황' },
        { color: 'hsl(0, 75%, 60%)', label: '빨강' }
      ]
    },
    tableCellProperties: {
      borderColors: [
        { color: 'hsl(0, 0%, 0%)', label: '검정' },
        { color: 'hsl(0, 0%, 30%)', label: '어두운 회색' },
        { color: 'hsl(0, 0%, 60%)', label: '회색' },
        { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
        { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true }
      ],
      backgroundColors: [
        { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true },
        { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
        { color: 'hsl(60, 75%, 60%)', label: '노랑' },
        { color: 'hsl(30, 75%, 60%)', label: '주황' },
        { color: 'hsl(0, 75%, 60%)', label: '빨강' }
      ]
    }
  },
  heading: {
    options: [
      { model: 'paragraph', title: '본문', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: '제목 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: '제목 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: '제목 3', class: 'ck-heading_heading3' }
    ]
  },
  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true
    }
  },
  language: 'en'
}; 