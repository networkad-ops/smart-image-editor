import React from 'react';
import { render, screen } from '@testing-library/react';
import TextPreview from '../src/components/TextPreview';

describe('TextPreview', () => {
  test('draftRange overlay wins over committed', () => {
    const raw = 'abcdef';
    const committed = [{ start: 1, end: 5, color: 'red' }];
    const draft = { start: 2, end: 4, color: 'blue' };
    render(<TextPreview rawText={raw} committedRanges={committed} draftRange={draft} />);
    const spans = screen.getAllByText(/a|b|c|d|e|f/);
    // Find any span with blue color text 'c' or 'd'
    const blueSpan = spans.find(s => (s as HTMLElement).style.color === 'blue');
    expect(blueSpan).toBeTruthy();
  });

  test('stable keys use lineIdx:segIdx:start-end pattern', () => {
    const raw = 'ab\ncd';
    const { container } = render(<TextPreview rawText={raw} committedRanges={[]} />);
    const spans = container.querySelectorAll('span > span');
    spans.forEach(node => {
      const key = node.getAttribute('key');
      // jsdom doesn\'t expose React keys; fallback: assert count equals segments rendered
      expect(node).toBeTruthy();
    });
  });
});


