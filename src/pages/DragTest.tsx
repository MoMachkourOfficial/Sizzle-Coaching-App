import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import { ArrowLeft, GripVertical } from 'lucide-react';

interface TestItem {
  id: string;
  content: string;
  color?: string;
}

interface Column {
  id: string;
  title: string;
  items: TestItem[];
}

export default function DragTest() {
  const [columns, setColumns] = useState<{ [key: string]: Column }>({
    column1: {
      id: 'column1',
      title: 'Column 1',
      items: [
        { id: 'item-1', content: 'Drag me!', color: '#f97316' },
        { id: 'item-2', content: 'Drag me too!', color: '#84cc16' },
        { id: 'item-3', content: 'And me!', color: '#06b6d4' }
      ]
    },
    column2: {
      id: 'column2',
      title: 'Column 2',
      items: []
    },
    column3: {
      id: 'column3',
      title: 'Column 3',
      items: []
    }
  });

  const handleDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) {
      console.log('Dropped outside valid area');
      return;
    }

    // No movement
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      console.log('No movement detected');
      return;
    }

    console.log('Moving item:', {
      itemId: draggableId,
      from: source.droppableId,
      fromIndex: source.index,
      to: destination.droppableId,
      toIndex: destination.index
    });

    // Create new state
    const newColumns = { ...columns };

    // Remove from source
    const sourceColumn = newColumns[source.droppableId];
    const [removed] = sourceColumn.items.splice(source.index, 1);

    // Add to destination
    const destColumn = newColumns[destination.droppableId];
    destColumn.items.splice(destination.index, 0, removed);

    setColumns(newColumns);
  };

  const handleDragStart = (result: any) => {
    console.log('Drag started:', result);
  };

  const handleDragUpdate = (result: any) => {
    console.log('Drag position updated:', result);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Drag and Drop Test</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Test Area</h2>
        <p className="text-gray-600 mb-6">
          Try dragging items between columns. Check the console for detailed event logging.
        </p>

        <DragDropContext
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
        >
          <div className="grid grid-cols-3 gap-6">
            {Object.values(columns).map((column) => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      bg-gray-50 rounded-lg p-4 min-h-[400px]
                      ${snapshot.isDraggingOver ? 'ring-2 ring-orange-500 bg-orange-50' : ''}
                      transition-colors duration-200
                    `}
                  >
                    <h3 className="text-lg font-semibold mb-4">{column.title}</h3>
                    
                    {column.items.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              group bg-white border rounded-lg p-4 mb-3
                              ${snapshot.isDragging ? 'shadow-lg scale-105 rotate-2' : 'shadow-sm'}
                              transition-all duration-200
                            `}
                            style={{
                              ...provided.draggableProps.style,
                              borderLeftWidth: '4px',
                              borderLeftColor: item.color || '#e5e7eb'
                            }}
                          >
                            <div className="flex items-center">
                              <div
                                {...provided.dragHandleProps}
                                className="mr-3 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.content}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  ID: {item.id}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
          <pre className="text-sm overflow-auto max-h-40">
            {JSON.stringify(columns, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
