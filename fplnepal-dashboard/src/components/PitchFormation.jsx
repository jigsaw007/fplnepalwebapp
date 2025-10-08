import React, { useState } from "react";
import { Minus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function PitchFormation({ squad }) {
  // flatten players
  const allPlayers = [
    ...squad[1],
    ...squad[2],
    ...squad[3],
    ...squad[4],
  ];

  const [pitch, setPitch] = useState(allPlayers.slice(0, 11));
  const [bench, setBench] = useState(allPlayers.slice(11));

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    // TODO: implement moving between pitch & bench
  };

  return (
    <div className="bg-green-700 bg-gradient-to-b from-green-600 to-green-800 text-white rounded-2xl p-4 shadow-md">
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Pitch area */}
        <Droppable droppableId="pitch" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex justify-center flex-wrap gap-4"
            >
              {pitch.map((p, index) => (
                <Draggable key={p.id} draggableId={`${p.id}`} index={index}>
                  {(prov) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      className="w-[80px] text-center"
                    >
                      <img
                        src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code}-220.webp`}
                        alt={p.web_name}
                        className="w-[70px] h-[70px] mx-auto"
                      />
                      <div className="text-xs mt-1 truncate">
                        {p.web_name}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Bench */}
        <div className="border-t border-white/20 mt-5 pt-2">
          <div className="text-xs text-center uppercase mb-2 opacity-80">
            Bench
          </div>
          <Droppable droppableId="bench" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex justify-center gap-3"
              >
                {bench.map((p, index) => (
                  <Draggable key={p.id} draggableId={`b-${p.id}`} index={index}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className="w-[70px] text-center"
                      >
                        <img
                          src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code}-220.webp`}
                          alt={p.web_name}
                          className="w-[60px] h-[60px] mx-auto opacity-90"
                        />
                        <div className="text-xs truncate">{p.web_name}</div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}
