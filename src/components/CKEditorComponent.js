import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '../ckeditor/CustomEditor';
import './CKEditorComponent.css';

const CKEditorComponent = ({ 
  value = '', 
  onChange, 
  placeholder = "문서 내용을 입력하세요...",
  height = "400px",
  disabled = false
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="custom-ckeditor-container">
      <div className="editor-header">
        <h3>📝 커스텀 CKEditor 5</h3>
        <p>✨ 전문적인 문서 편집기 - 표 편집, 서식, 링크 등 지원</p>
      </div>

      {error && (
        <div className="editor-error">
          <h4>⚠️ 에디터 오류</h4>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsReady(false);
            }}
            className="retry-button"
          >
            다시 시도
          </button>
        </div>
      )}

      {!error && (
        <div 
          className={`editor-wrapper ${disabled ? 'disabled' : ''}`}
          style={{ minHeight: height }}
        >
          <CKEditor
            editor={ClassicEditor}
            data={value}
            disabled={disabled}
            config={{
              licenseKey: 'GPL', // GPL 라이선스 사용
              placeholder: placeholder,
              toolbar: {
                shouldNotGroupWhenFull: true, // 툴바 그룹화 비활성화 - 항상 모든 버튼 표시
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
                tableToolbar: ['bold', 'italic']
              },
              heading: {
                options: [
                  { model: 'paragraph', title: '본문', class: 'ck-heading_paragraph' },
                  { model: 'heading1', view: 'h1', title: '제목 1', class: 'ck-heading_heading1' },
                  { model: 'heading2', view: 'h2', title: '제목 2', class: 'ck-heading_heading2' },
                  { model: 'heading3', view: 'h3', title: '제목 3', class: 'ck-heading_heading3' }
                ]
              }
            }}
            onReady={(editor) => {
              console.log('✅ 커스텀 CKEditor5가 준비되었습니다!', editor);
              setIsReady(true);
              setError(null);
            }}
            onChange={(event, editor) => {
              const data = editor.getData();
              if (onChange) {
                onChange(data);
              }
            }}
            onError={(error, { willEditorRestart }) => {
              console.error('❌ CKEditor5 오류:', error);
              setError(`에디터 오류: ${error.message}`);
              
              if (willEditorRestart) {
                console.log('🔄 에디터가 재시작됩니다...');
              }
            }}
          />
        </div>
      )}

      <div className="editor-footer">
        <div className="status-indicator">
          <span className={`status-dot ${isReady ? 'ready' : 'loading'}`}></span>
          <span className="status-text">
            {isReady ? '준비됨' : '로딩 중...'}
          </span>
        </div>
        
        <div className="editor-features">
          <h4>🎯 지원 기능</h4>
          <div className="feature-list">
            <span className="feature-item">📝 텍스트 서식</span>
            <span className="feature-item">📊 표 편집</span>
            <span className="feature-item">🔗 링크</span>
            <span className="feature-item">📋 목록</span>
            <span className="feature-item">📑 제목</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CKEditorComponent; 