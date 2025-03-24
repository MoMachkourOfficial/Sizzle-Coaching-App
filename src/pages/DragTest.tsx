import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';

interface TestCard {
  id: string;
  content: string;
}

export default function DragTest() {
  const [cards, setCards] = useState<{ [key: string]: TestCard[] }>({
    columnA: [
      { id: 'card-1', content: 'This is a test card that you can drag between columns' }
    ],
    columnB: []
  });

  const handleDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // No movement
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Find the card that was dragged
    const card = cards[source.droppableId].find(c => c.id === draggableId);
    if (!card) return;

    // Create new state
    const newCards = { ...cards };

    // Remove from source
    newCards[source.droppableId] = cards[source.droppableId].filter(
      c => c.id !== draggableId
    );

    // Add to destination
    newCards[destination.droppableId] = [
      ...cards[destination.droppableId].slice(0, destination.index),
      card,
      ...cards[destination.droppableId].slice(destination.index)
    ];

    setCards(newCards);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Drag and Drop Test</h1>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 gap-8">
          {['columnA', 'columnB'].map((columnId) => (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    bg-white rounded-lg shadow-lg p-4 min-h-[400px]
                    ${snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-500' : ''}
                  `}
                >
                  <h2 className="text-xl font-semibold mb-4">
                    {columnId === 'columnA' ? 'Column A' : 'Column B'}
                  </h2>
                  
                  {cards[columnId].map((card, index) => (
                    <Draggable
                      key={card.id}
                      draggableId={card.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            group bg-white border rounded-lg p-4 mb-4 shadow-sm
                            ${snapshot.isDragging ? 'shadow-lg scale-105 rotate-2 border-blue-500 bg-blue-50' : ''}
                            transition-all duration-200
                          `}
                        >
                          <div className="flex items-center">
                            <div
                              {...provided.dragHandleProps}
                              className="mr-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-gray-800">{card.content}</p>
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
    </div>
  );
}
