/**
 * 이미지 리사이즈 ProseMirror Plugin
 * 이미지 클릭 시 리사이즈 핸들을 표시하고, 드래그로 크기를 조절할 수 있게 함
 */

'use client';

import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { NodeSelection } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

const MIN = 50;
const MAX = 1200;
const HANDLE_SIZE = 16;

// 이미지 노드인지 확인
function isImageNode(node: ProseMirrorNode): boolean {
    return node.type.name === 'image';
}

// 선택된 이미지 정보 가져오기
function getSelectedImage(view: EditorView): {
    pos: number;
    node: ProseMirrorNode;
    img: HTMLImageElement;
} | null {
    const sel = view.state.selection;
    if (!(sel instanceof NodeSelection)) return null;
    if (!isImageNode(sel.node)) return null;

    const pos = sel.from;
    const dom = view.nodeDOM(pos) as unknown;

    let img: HTMLImageElement | null = null;
    if (dom instanceof HTMLImageElement) {
        img = dom;
    } else if (dom instanceof HTMLElement) {
        img = dom.querySelector('img');
    }

    if (!img) return null;
    return { pos, node: sel.node, img };
}

// 값 제한 함수
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function createImageResizePlugin() {
    let active: { pos: number; node: ProseMirrorNode; img: HTMLImageElement } | null = null;
    let container: HTMLElement | null = null;
    let handle: HTMLButtonElement | null = null;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;
    let aspect = 1;

    // 핸들 표시
    const show = (info: { pos: number; node: ProseMirrorNode; img: HTMLImageElement }) => {
        if (!container || !handle) return;

        active = info;
        const img = info.img;

        // 원본 크기 가져오기
        const currentWidth = parseInt(img.style.width, 10) || img.naturalWidth || img.width || 300;
        const currentHeight = parseInt(img.style.height, 10) || img.naturalHeight || img.height || 200;
        aspect = currentWidth / currentHeight;

        // 이미지에 스타일 적용
        img.style.width = `${currentWidth}px`;
        img.style.height = `${currentHeight}px`;
        img.style.maxWidth = '100%';
        img.style.objectFit = 'contain';

        handle.style.display = 'block';
        positionHandle();
    };

    // 핸들 숨김
    const hide = () => {
        if (handle) {
            handle.style.display = 'none';
        }
        active = null;
    };

    // 핸들 위치 계산
    const positionHandle = () => {
        if (!active || !container || !handle) return;
        const imgRect = active.img.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const left =
            imgRect.right - containerRect.left + container.scrollLeft - HANDLE_SIZE / 2;
        const top =
            imgRect.bottom - containerRect.top + container.scrollTop - HANDLE_SIZE / 2;

        handle.style.left = `${left}px`;
        handle.style.top = `${top}px`;
    };

    // 마우스 이동 핸들러
    const onMouseMove = (e: MouseEvent) => {
        if (!dragging || !active) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let nextW = clamp(startW + dx, MIN, MAX);
        let nextH = clamp(startH + dy, MIN, MAX);

        // Shift: 비율 유지
        if (e.shiftKey) {
            nextH = clamp(nextW / aspect, MIN, MAX);
        }

        active.img.style.width = `${Math.round(nextW)}px`;
        active.img.style.height = `${Math.round(nextH)}px`;
        positionHandle();
    };

    // 마우스 업 핸들러
    const onMouseUp = (view: EditorView) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return () => {
            if (!dragging || !active) return;
            dragging = false;

            window.removeEventListener('mousemove', onMouseMove);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            window.removeEventListener('mouseup', onMouseUp(view) as any);

            // 최종 크기를 노드 attrs로 저장
            const width = parseInt(active.img.style.width, 10) || Math.round(startW);
            const height = parseInt(active.img.style.height, 10) || Math.round(startH);

            const { state } = view;
            const nodeNow = state.doc.nodeAt(active.pos);
            if (!nodeNow) return;

            const tr = state.tr.setNodeMarkup(active.pos, undefined, {
                ...nodeNow.attrs,
                width,
                height,
            });
            view.dispatch(tr);
        };
    };

    return new Plugin({
        key: new PluginKey('imageResize'),
        view(editorView) {
            // 컨테이너 찾기
            container = editorView.dom.closest('.ProseMirror')?.parentElement || editorView.dom.parentElement;
            if (!container) {
                console.error('[ImageResize] 컨테이너를 찾을 수 없습니다.');
                return {};
            }

            // 컨테이너에 relative 포지셔닝 추가
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }

            // 핸들 생성
            handle = document.createElement('button');
            handle.type = 'button';
            handle.className = 'resize-handle';
            Object.assign(handle.style, {
                position: 'absolute',
                width: `${HANDLE_SIZE}px`,
                height: `${HANDLE_SIZE}px`,
                backgroundColor: '#3b82f6',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'se-resize',
                display: 'none',
                zIndex: '1000',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.1s',
                pointerEvents: 'auto',
            });
            container.appendChild(handle);

            // 핸들 드래그 시작
            handle.addEventListener('mousedown', (e) => {
                if (!active) return;
                e.preventDefault();
                e.stopPropagation();

                dragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startW = parseInt(active.img.style.width, 10) || active.img.naturalWidth || 300;
                startH = parseInt(active.img.style.height, 10) || active.img.naturalHeight || 200;

                window.addEventListener('mousemove', onMouseMove);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                window.addEventListener('mouseup', onMouseUp(editorView) as any);
            });

            // 스크롤 시 핸들 위치 업데이트
            const onScroll = () => {
                if (active) {
                    positionHandle();
                }
            };
            container.addEventListener('scroll', onScroll);

            return {
                destroy() {
                    if (handle && handle.parentElement) {
                        handle.parentElement.removeChild(handle);
                    }
                    container?.removeEventListener('scroll', onScroll);
                },
                update(view) {
                    // 선택 상태 변경 감지
                    const next = getSelectedImage(view);
                    if (!next) {
                        if (active) {
                            hide();
                        }
                        return;
                    }

                    if (!active || active.pos !== next.pos) {
                        show(next);
                    } else {
                        positionHandle(); // 같은 이미지면 위치만 업데이트
                    }
                },
            };
        },
        props: {
            handleDOMEvents: {
                click(view, event) {
                    // 이미지 클릭 시 NodeSelection 생성
                    const target = event.target as HTMLElement;
                    const img = target.closest('img');
                    if (!img) return false;

                    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
                    if (!pos) return false;

                    const $pos = view.state.doc.resolve(pos.pos);
                    const imagePos = $pos.pos;

                    // 이미지 노드 찾기
                    for (let i = 0; i < 10; i++) {
                        const node = view.state.doc.nodeAt(imagePos);
                        if (node && isImageNode(node)) {
                            const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, imagePos));
                            view.dispatch(tr);
                            return true;
                        }
                        // 이전/다음 노드 확인
                        const prevNode = view.state.doc.nodeAt(imagePos - 1);
                        const nextNode = view.state.doc.nodeAt(imagePos + 1);
                        if (prevNode && isImageNode(prevNode)) {
                            const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, imagePos - 1));
                            view.dispatch(tr);
                            return true;
                        }
                        if (nextNode && isImageNode(nextNode)) {
                            const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, imagePos + 1));
                            view.dispatch(tr);
                            return true;
                        }
                        break;
                    }
                    return false;
                },
            },
        },
    });
}
