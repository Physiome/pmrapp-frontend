/**
 * Counts how many leading children of `container` fit within its width on a
 * single line. The container must be the children's offset parent (e.g.
 * `position: relative`) so `offsetLeft` is measured from its edge.
 */
export const countFittingChildren = (container: HTMLElement): number => {
  const width = container.clientWidth
  let count = 0

  for (const child of Array.from(container.children) as HTMLElement[]) {
    if (child.offsetLeft + child.offsetWidth > width) break
    count += 1
  }

  return count
}
