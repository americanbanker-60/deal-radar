import React from "react";
import TargetRow from "./TargetRow";

export default function VirtualizedTargetTable({
  targets,
  selectedTargets,
  onToggle,
  onRowClick,
  onRefreshData,
  refreshingData,
}) {
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