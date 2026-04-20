describe('Test environment sanity check', () => {
  test('jest + jest-dom are wired up', () => {
    const div = document.createElement('div');
    div.textContent = 'hello';
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    expect(div).toHaveTextContent('hello');
    document.body.removeChild(div);
  });
});
