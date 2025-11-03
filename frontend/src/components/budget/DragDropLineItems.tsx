import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardContent, Button, Badge } from '../ui';
import { BudgetLineItem } from '@/types';

interface SortableLineItemProps {
  item: BudgetLineItem;
  onEdit?: (item: BudgetLineItem) => void;
  onDelete?: (id: string) => void;
}

function SortableLineItem({ item, onEdit, onDelete }: SortableLineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 bg-white ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <button
            {...attributes}
            {...listeners}
            className="mr-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label="Drag to reorder"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant="primary" size="sm">{item.category}</Badge>
              <span className="text-sm text-gray-500">Order: {item.order}</span>
            </div>
            <h4 className="font-semibold text-gray-900">{item.description || 'Untitled'}</h4>
            <div className="mt-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Budgeted:</span>
                <span className="font-medium">${item.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Allocated:</span>
                <span className="font-medium">${item.allocatedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining:</span>
                <span className="font-medium">${item.remainingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="text-blue-600 hover:text-blue-800 text-sm"
              aria-label="Edit line item"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="text-red-600 hover:text-red-800 text-sm"
              aria-label="Delete line item"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DragDropLineItemsProps {
  items: BudgetLineItem[];
  onReorder: (items: BudgetLineItem[]) => void;
  onEdit?: (item: BudgetLineItem) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
}

export function DragDropLineItems({
  items,
  onReorder,
  onEdit,
  onDelete,
  onAdd
}: DragDropLineItemsProps) {
  const [lineItems, setLineItems] = useState(items);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLineItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const reordered = arrayMove(items, oldIndex, newIndex);

        // Update order property
        const updated = reordered.map((item, index) => ({
          ...item,
          order: index + 1
        }));

        onReorder(updated);
        return updated;
      });
    }
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalAllocated = lineItems.reduce((sum, item) => sum + item.allocatedAmount, 0);

  return (
    <Card>
      <CardHeader
        title="Budget Line Items"
        subtitle={`${lineItems.length} items • Total: $${totalAmount.toLocaleString()}`}
        action={
          onAdd && (
            <Button onClick={onAdd} size="sm">
              Add Line Item
            </Button>
          )
        }
      />

      <CardContent>
        {/* Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Total Budget</div>
              <div className="text-lg font-semibold">${totalAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Allocated</div>
              <div className="text-lg font-semibold text-blue-600">${totalAllocated.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Remaining</div>
              <div className="text-lg font-semibold text-green-600">
                ${(totalAmount - totalAllocated).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Drag and Drop List */}
        {lineItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No line items yet</p>
            {onAdd && (
              <Button onClick={onAdd} className="mt-4">
                Add Your First Line Item
              </Button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lineItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {lineItems.map((item) => (
                  <SortableLineItem
                    key={item.id}
                    item={item}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <strong>Tip:</strong> Drag and drop line items to reorder them. The order determines how they appear in reports.
        </div>
      </CardContent>
    </Card>
  );
}
