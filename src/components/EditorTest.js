import React, { useState } from 'react';
import CKEditorComponent from './CKEditorComponent';

const EditorTest = () => {
  const [content, setContent] = useState(`
    <h1>커스텀 CKEditor 5 테스트</h1>
    <p>이것은 소스 기반 커스텀 빌드로 만든 CKEditor 5입니다.</p>
    <h2>주요 기능</h2>
    <ul>
      <li><strong>텍스트 서식</strong> - 굵게, 기울임, 밑줄, 취소선</li>
      <li><strong>표 편집</strong> - 셀 병합, 분할, 속성 설정</li>
      <li><strong>목록</strong> - 순서 있는 목록, 순서 없는 목록</li>
      <li><strong>링크</strong> - URL 링크 삽입</li>
    </ul>
    <h3>표 테스트</h3>
    <table>
      <thead>
        <tr>
          <th>항목</th>
          <th>설명</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>기본 서식</td>
          <td>굵게, 기울임, 밑줄 등</td>
          <td>✅ 완료</td>
        </tr>
        <tr>
          <td>표 기능</td>
          <td>셀 병합, 분할, 속성</td>
          <td>✅ 완료</td>
        </tr>
      </tbody>
    </table>
    <p>이 에디터는 <a href="https://ckeditor.com/">CKEditor 5</a>를 기반으로 합니다.</p>
  `);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    console.log('📝 에디터 내용 변경:', newContent);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1>🧪 커스텀 CKEditor 5 테스트</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          소스 기반 커스텀 빌드로 구현된 CKEditor 5를 테스트해보세요.
        </p>
      </div>

      <CKEditorComponent
        value={content}
        onChange={handleContentChange}
        placeholder="여기에 내용을 입력하세요. 표, 서식, 링크 등 다양한 기능을 사용해보세요!"
        height="600px"
      />

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e1e5e9'
      }}>
        <h3>📊 현재 에디터 내용 (HTML)</h3>
        <pre style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '4px', 
          overflow: 'auto',
          fontSize: '12px',
          color: '#666',
          maxHeight: '200px'
        }}>
          {content}
        </pre>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        background: '#e8f5e8', 
        borderRadius: '8px',
        border: '1px solid #c3e6c3'
      }}>
        <h3>✅ 테스트 체크리스트</h3>
        <ul style={{ margin: 0 }}>
          <li>✅ 기본 텍스트 입력</li>
          <li>✅ 굵게, 기울임, 밑줄, 취소선</li>
          <li>✅ 제목 (H1, H2, H3)</li>
          <li>✅ 순서 있는/없는 목록</li>
          <li>✅ 링크 삽입</li>
          <li>✅ 표 삽입 및 편집</li>
          <li>✅ 셀 병합/분할</li>
          <li>✅ 표 속성 설정</li>
          <li>✅ Undo/Redo</li>
        </ul>
      </div>
    </div>
  );
};

export default EditorTest; 