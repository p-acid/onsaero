import { useState } from 'react'
import type { MandalaCell, MandartData } from '../../../entities/goal'
import { useCreateGoalStore } from '../../../shared/store/create-goal-store'
import { Button } from '../../../shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../shared/ui/dialog'
import { Input } from '../../../shared/ui/input'
import { Label } from '../../../shared/ui/label'
import { Textarea } from '../../../shared/ui/textarea'

// 빈 3x3 셀 배열 생성 헬퍼
const createEmpty3x3 = (): MandalaCell[][] => {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => ({
      id: crypto.randomUUID(),
      title: '',
      description: '',
    })),
  )
}

type OuterGridKey =
  | 'topLeft'
  | 'top'
  | 'topRight'
  | 'left'
  | 'right'
  | 'bottomLeft'
  | 'bottom'
  | 'bottomRight'

export const MandartStep = () => {
  const { formData, setMandartData, prevStep } = useCreateGoalStore()

  // 중앙 3x3 그리드 초기화
  const [centerGrid, setCenterGrid] = useState<MandalaCell[][]>(
    formData.mandartData?.mandalaGrid?.center || createEmpty3x3(),
  )

  // 외부 8개 3x3 그리드 초기화
  const [outerGrids, setOuterGrids] = useState<
    Record<OuterGridKey, MandalaCell[][]>
  >(
    formData.mandartData?.mandalaGrid?.outer || {
      topLeft: createEmpty3x3(),
      top: createEmpty3x3(),
      topRight: createEmpty3x3(),
      left: createEmpty3x3(),
      right: createEmpty3x3(),
      bottomLeft: createEmpty3x3(),
      bottom: createEmpty3x3(),
      bottomRight: createEmpty3x3(),
    },
  )

  // 셀 편집 다이얼로그 상태
  const [editingCell, setEditingCell] = useState<{
    gridType: 'center' | OuterGridKey
    row: number
    col: number
    cell: MandalaCell
  } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // 셀 클릭 핸들러
  const handleCellClick = (
    gridType: 'center' | OuterGridKey,
    row: number,
    col: number,
  ) => {
    let cell: MandalaCell
    if (gridType === 'center') {
      cell = centerGrid[row][col]
    } else {
      cell = outerGrids[gridType][row][col]
    }

    setEditingCell({ gridType, row, col, cell })
    setEditTitle(cell.title)
    setEditDescription(cell.description || '')
  }

  // 셀 저장 핸들러
  const handleSaveCell = () => {
    if (!editingCell) return

    const updatedCell: MandalaCell = {
      ...editingCell.cell,
      title: editTitle,
      description: editDescription,
    }

    if (editingCell.gridType === 'center') {
      const newCenterGrid = centerGrid.map((row, rowIndex) =>
        row.map((cell, colIndex) =>
          rowIndex === editingCell.row && colIndex === editingCell.col
            ? updatedCell
            : cell,
        ),
      )
      setCenterGrid(newCenterGrid)

      // 중앙 그리드 셀이 변경되면 해당하는 외부 그리드의 중앙 셀도 동기화
      syncCenterToOuter(editingCell.row, editingCell.col, updatedCell)
    } else {
      const newOuterGrids = {
        ...outerGrids,
        [editingCell.gridType]: outerGrids[editingCell.gridType].map(
          (row, rowIndex) =>
            row.map((cell, colIndex) =>
              rowIndex === editingCell.row && colIndex === editingCell.col
                ? updatedCell
                : cell,
            ),
        ),
      }
      setOuterGrids(newOuterGrids)

      // 외부 그리드의 중앙 셀(1,1)이 변경되면 중앙 그리드의 해당 셀도 동기화
      if (editingCell.row === 1 && editingCell.col === 1) {
        syncOuterToCenter(editingCell.gridType, updatedCell)
      }
    }

    setEditingCell(null)
    setEditTitle('')
    setEditDescription('')
  }

  // 중앙 그리드 → 외부 그리드 동기화
  const syncCenterToOuter = (
    row: number,
    col: number,
    updatedCell: MandalaCell,
  ) => {
    // 중앙 그리드의 위치에 따라 해당하는 외부 그리드 결정
    const mapping: Record<string, OuterGridKey | null> = {
      '0,0': 'topLeft',
      '0,1': 'top',
      '0,2': 'topRight',
      '1,0': 'left',
      '1,1': null, // 중심 셀은 동기화 안 함
      '1,2': 'right',
      '2,0': 'bottomLeft',
      '2,1': 'bottom',
      '2,2': 'bottomRight',
    }

    const outerKey = mapping[`${row},${col}`]
    if (outerKey) {
      setOuterGrids((prev) => ({
        ...prev,
        [outerKey]: prev[outerKey].map((outerRow, outerRowIndex) =>
          outerRow.map((cell, outerColIndex) =>
            outerRowIndex === 1 && outerColIndex === 1 ? updatedCell : cell,
          ),
        ),
      }))
    }
  }

  // 외부 그리드 → 중앙 그리드 동기화
  const syncOuterToCenter = (
    outerKey: OuterGridKey,
    updatedCell: MandalaCell,
  ) => {
    const mapping: Record<OuterGridKey, [number, number]> = {
      topLeft: [0, 0],
      top: [0, 1],
      topRight: [0, 2],
      left: [1, 0],
      right: [1, 2],
      bottomLeft: [2, 0],
      bottom: [2, 1],
      bottomRight: [2, 2],
    }

    const [centerRow, centerCol] = mapping[outerKey]
    setCenterGrid((prev) =>
      prev.map((row, rowIndex) =>
        row.map((cell, colIndex) =>
          rowIndex === centerRow && colIndex === centerCol ? updatedCell : cell,
        ),
      ),
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const mandartData: MandartData = {
      centerGoal: centerGrid[1][1].title,
      subGoals: [],
      mandalaGrid: {
        center: centerGrid,
        outer: outerGrids,
      },
    }

    setMandartData(mandartData)

    // TODO: 실제 API 호출로 목표 생성
    console.log('Mandart Data:', mandartData)
  }

  // 3x3 그리드 렌더링 컴포넌트
  const Grid3x3 = ({
    grid,
    gridType,
    isCenter = false,
  }: {
    grid: MandalaCell[][]
    gridType: 'center' | OuterGridKey
    isCenter?: boolean
  }) => (
    <div className="grid grid-cols-3 gap-0.5 rounded-md bg-border p-0.5 md:gap-1 md:p-1">
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isCenterCell = isCenter && rowIndex === 1 && colIndex === 1
          const isOuterCenterCell =
            !isCenter && rowIndex === 1 && colIndex === 1

          return (
            <button
              key={cell.id}
              type="button"
              onClick={() => handleCellClick(gridType, rowIndex, colIndex)}
              className={`flex min-h-12 flex-col items-center justify-center rounded-sm p-1.5 text-center transition-all hover:scale-105 hover:shadow-sm md:min-h-16 md:p-2 ${
                isCenterCell
                  ? 'bg-primary font-semibold text-primary-foreground hover:bg-primary/90'
                  : isOuterCenterCell
                    ? 'bg-muted/50 font-medium hover:bg-muted/70'
                    : 'bg-background hover:bg-accent'
              }`}
            >
              <span className="line-clamp-2 break-words font-medium text-[10px] md:text-xs">
                {cell.title || (isCenterCell ? 'Main Goal' : '+')}
              </span>
              {cell.description && !isCenterCell && (
                <span className="mt-0.5 line-clamp-1 text-[8px] text-muted-foreground md:text-[9px]">
                  {cell.description}
                </span>
              )}
            </button>
          )
        }),
      )}
    </div>
  )

  const isValid = centerGrid[1][1].title.trim() !== ''

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:space-y-8">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">만다라트 목표 작성</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          중앙의 Main Goal을 작성하고, 주변 8개 세부 목표와 각각의 실행 과제들을
          입력해주세요
        </p>
        <div className="rounded-lg bg-muted/50 p-3 text-muted-foreground text-xs md:text-sm">
          <p>
            💡 <strong>사용 방법:</strong> 중앙(Main Goal)에 주요 목표를
            입력하세요. 주변 8칸에는 세부 목표가, 바깥 영역에는 각 세부 목표의
            실행 과제들이 자동으로 동기화됩니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* 9x9 Mandala Chart */}
        <div className="overflow-x-auto">
          <div className="grid min-w-[600px] grid-cols-3 gap-1 md:min-w-0 md:gap-2">
            {/* 좌측 상단 */}
            <Grid3x3 grid={outerGrids.topLeft} gridType="topLeft" />
            {/* 상단 중앙 */}
            <Grid3x3 grid={outerGrids.top} gridType="top" />
            {/* 우측 상단 */}
            <Grid3x3 grid={outerGrids.topRight} gridType="topRight" />

            {/* 좌측 중앙 */}
            <Grid3x3 grid={outerGrids.left} gridType="left" />
            {/* 중앙 메인 그리드 */}
            <Grid3x3 grid={centerGrid} gridType="center" isCenter />
            {/* 우측 중앙 */}
            <Grid3x3 grid={outerGrids.right} gridType="right" />

            {/* 좌측 하단 */}
            <Grid3x3 grid={outerGrids.bottomLeft} gridType="bottomLeft" />
            {/* 하단 중앙 */}
            <Grid3x3 grid={outerGrids.bottom} gridType="bottom" />
            {/* 우측 하단 */}
            <Grid3x3 grid={outerGrids.bottomRight} gridType="bottomRight" />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            size="lg"
            className="w-full sm:w-auto"
          >
            이전
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            size="lg"
            className="w-full sm:w-auto"
          >
            목표 생성
          </Button>
        </div>
      </form>

      {/* 셀 편집 다이얼로그 */}
      <Dialog open={!!editingCell} onOpenChange={() => setEditingCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>목표 입력</DialogTitle>
            <DialogDescription>
              목표의 제목과 설명을 입력해주세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="목표 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="목표에 대한 설명을 입력하세요 (선택사항)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingCell(null)}
            >
              취소
            </Button>
            <Button type="button" onClick={handleSaveCell}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
