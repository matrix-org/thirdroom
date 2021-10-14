import React, { forwardRef, ReactNode } from "react";
import { useParams, useLocation } from "react-router-dom";
import { ErrorMessage } from "../input/ErrorMessage";
import classNames from "classnames";
import { useRoomManager } from "../matrix/useRoomManager";
import {
  RoomManager,
  RoomManagerEvent,
  RoomManagerState,
} from "../../world/RoomManager";
import { Button } from "../input";

interface RoomErrorProps {
  error?: Error;
}

export function RoomError({ error }: RoomErrorProps) {
  return <ErrorMessage error={error} />;
}

export function RoomLoading() {
  return <div>Loading...</div>;
}

type RoomUIProps = RoomManagerState & {
  dispatch: (event: string, ...args: any[]) => void;
};

export function RoomUI({ dispatch, entered }: RoomUIProps) {
  return (
    <>
      {!entered && (
        <div className="create-room-container">
          <div className="container-content">
            <Button onClick={() => dispatch(RoomManagerEvent.EnterRoom)}>
              Enter Room
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

interface ViewportProps {
  className?: string;
  children?: ReactNode;
}

const Viewport = forwardRef<HTMLCanvasElement, ViewportProps>(
  ({ className, children, ...rest }, ref) => {
    return (
      <div className={classNames("viewport", className)} {...rest}>
        <canvas ref={ref} />
        <div className="ui-container">{children}</div>
      </div>
    );
  }
);

interface RoomPageProps<S> {
  className?: string;
  roomManager: RoomManager<S>;
  loadingComponent?: React.ComponentType<any>;
  errorComponent?: React.ComponentType<RoomErrorProps>;
  roomUIComponent?: React.ComponentType<RoomUIProps>;
}

export function RoomPage({
  className,
  roomManager,
  loadingComponent: LoadingComponent = RoomLoading,
  errorComponent: ErrorComponent = RoomError,
  roomUIComponent: RoomUIComponent = RoomUI,
}: RoomPageProps<RoomManagerState>) {
  const { roomId } = useParams<{ roomId: string }>();
  const { hash } = useLocation();
  const { canvasRef, loading, error, state, dispatch } = useRoomManager(
    roomManager,
    roomId || hash
  );

  return (
    <Viewport ref={canvasRef} className={className}>
      {error && <ErrorComponent error={error} />}
      {loading && !error && <LoadingComponent />}
      {!loading && !error && <RoomUIComponent {...state} dispatch={dispatch} />}
    </Viewport>
  );
}
