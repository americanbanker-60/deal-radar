import React, { useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import TargetRow from "./TargetRow";

const ROW_HEIGHT = 64;
const VIRTUALIZATION_THRESHOLD = 100;

/**
 * Wraps the target table body with react-window virtualization
 * when the row count exceeds VIRTUALIZATION_THRESHOLD.
 * Falls back to regular rendering for small datasets.
 */
export default function VirtualizedTargetTable({
  targets,
  selectedTargets,
  onToggle,
  onRowClick,
  onRefreshData,
  refreshingData,
  maxHeight = 600,
}) {
  const Row = useCallback(({ index, style }) => {
    const target = targets[index];
    return (
      <div style={style}>
        <table className="w-full text-sm min-w-[1400px]">
          <tbody>
            <TargetRow
              key={target.id}
              target={target}
              isSelected={selectedTargets.has(target.id)}
              onToggle={onToggle}
              onRowClick={onRowClick}
              onRefreshData={onRefreshData}
              isRefreshingData={refreshingData === target.id}
            />
          </tbody>
        </table>
      </div>
    );
  }, [targets, selectedTargets, onToggle, onRowClick, onRefreshData, refreshingData]);

  // For small datasets, don't virtualize
  if (targets.length < VIRTUALIZATION_THRESHOLD) {
    return (
      <tbody>
        {targets.map((t) => (
          <TargetRow
            key={t.id}
            target={t}
            isSelected={selectedTargets.has(t.id)}
            onToggle={onToggle}
            onRowClick={onRowClick}
            onRefreshData={onRefreshData}
            isRefreshingData={refreshingData === t.id}
          />
        ))}
      </tbody>
    );
  }

  // For large datasets, use windowed rendering
  return (
    <tbody>
      <tr>
        <td colSpan="15" className="p-0">
          <List
            height={Math.min(maxHeight, targets.length * ROW_HEIGHT)}
            itemCount={targets.length}
            itemSize={ROW_HEIGHT}
            width="100%"
            overscanCount={10}
          >
            {Row}
          </List>
        </td>
      </tr>
    </tbody>
  );
}
